const form = document.querySelector('#budget-form');
const results = document.querySelector('#results');
const status = document.querySelector('#form-status');
const submitButton = form.querySelector('button');
const goalForm = document.querySelector('#goal-form');
const goalResults = document.querySelector('#goal-results');
const goalStatus = document.querySelector('#goal-status');

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const API_BASE_URL = window.API_BASE_URL || '';

async function fetchJson(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = data?.message || `Falha na requisição ${endpoint} (${response.status})`;
    const detail = data?.detail ? ` Detalhe: ${data.detail}` : '';
    throw new Error(`${message}${detail}`);
  }

  return data;
}

function parseMoney(value) {
  const normalized = value.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  return Number(normalized);
}

function inputMoney(value) {
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function messageText(message) {
  return message.type === 'positive'
    ? `Hoje você pode gastar até ${currency.format(Number(message.text.split(' ').at(-1)))}`
    : message.text;
}

function render(data) {
  document.querySelector('#total-remaining').textContent = currency.format(data.totalRemaining);
  document.querySelector('#daily-limit').textContent = currency.format(data.dailyLimit);
  document.querySelector('#today-message').textContent = messageText(data.days[0].message);
  document.querySelector('#today-card').className = `summary-card status-card ${data.days[0].message.type}`;

  document.querySelector('#schedule-body').innerHTML = data.days.map((day) => `
    <tr>
      <td>${dateFormatter.format(new Date(`${day.date}T00:00:00Z`))}</td>
      <td class="amount">${currency.format(day.plannedRemaining)}</td>
      <td class="amount ${day.dailyBalance < 0 ? 'negative' : ''}">${currency.format(day.dailyBalance)}</td>
      <td><span class="message ${day.message.type}">${messageText(day.message)}</span></td>
    </tr>`).join('');

  results.classList.add('visible');
}

function renderGoal(data) {
  document.querySelector('#monthly-goal').textContent = currency.format(data.monthlyAmount);
  document.querySelector('#goal-total').textContent = currency.format(data.targetAmount);
  document.querySelector('#goal-term').textContent = `${data.months} ${data.months === 1 ? 'mês' : 'meses'}`;
  document.querySelector('#goal-finish').textContent = document.querySelector('#goal-term').textContent;
  document.querySelector('#goal-pill').textContent = `${data.months} ${data.months === 1 ? 'parcela' : 'parcelas'}`;
  document.querySelector('#goal-progress-bar').style.width = '100%';

  document.querySelector('#goal-schedule-body').innerHTML = data.schedule.map((item) => `
    <tr>
      <td>Mês ${item.month}</td>
      <td class="amount">${currency.format(item.contribution)}</td>
      <td class="amount">${currency.format(item.accumulated)}</td>
      <td><div class="progress-cell"><div class="mini-track"><i style="width:${item.progress}%"></i></div><span>${item.progress.toLocaleString('pt-BR')}%</span></div></td>
    </tr>`).join('');
  goalResults.classList.add('visible');
}

async function loadBudget() {
  try {
    const data = await fetchJson('/api/budget');
    form.monthlyIncome.value = inputMoney(data.monthlyIncome);
    form.monthlyExpenses.value = inputMoney(data.monthlyExpenses);
    form.startDate.value = data.startDate;
    if (data.monthlyIncome || data.monthlyExpenses) render(data);
  } catch (error) {
    status.textContent = error.message;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = '';
  submitButton.disabled = true;

  try {
    const payload = {
      monthlyIncome: parseMoney(form.monthlyIncome.value),
      monthlyExpenses: parseMoney(form.monthlyExpenses.value),
      startDate: form.startDate.value
    };
    if (!Number.isFinite(payload.monthlyIncome) || !Number.isFinite(payload.monthlyExpenses)) {
      throw new Error('Informe valores monetários válidos.');
    }
    const data = await fetchJson('/api/budget', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    render(data);
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    status.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

loadBudget();

document.querySelectorAll('.nav-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav-button').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.app-view').forEach((view) => view.classList.toggle('active', view.id === button.dataset.view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

async function loadSavingsGoal() {
  try {
    const data = await fetchJson('/api/savings-goal');
    if (!data) return;
    goalForm.targetAmount.value = inputMoney(data.targetAmount);
    goalForm.months.value = data.months;
    renderGoal(data);
  } catch (error) {
    goalStatus.textContent = error.message;
  }
}

goalForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  goalStatus.textContent = '';
  const button = goalForm.querySelector('button');
  button.disabled = true;

  try {
    const payload = {
      targetAmount: parseMoney(goalForm.targetAmount.value),
      months: Number(goalForm.months.value)
    };
    if (!Number.isFinite(payload.targetAmount)) throw new Error('Informe um valor válido para a meta.');
    const data = await fetchJson('/api/savings-goal', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    renderGoal(data);
    goalResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    goalStatus.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

loadSavingsGoal();
