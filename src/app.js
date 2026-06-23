const path = require('path');
const express = require('express');
const budgetRoutes = require('./routes/budgetRoutes');
const savingsGoalRoutes = require('./routes/savingsGoalRoutes');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api/budget', budgetRoutes);
app.use('/api/savings-goal', savingsGoalRoutes);

app.use((error, _request, response, _next) => {
  const clientError = error instanceof TypeError || error.name === 'ValidationError';
  if (!clientError) console.error(error);
  response.status(clientError ? 400 : 500).json({
    message: clientError ? error.message : 'Não foi possível concluir a operação.'
  });
});

module.exports = app;
