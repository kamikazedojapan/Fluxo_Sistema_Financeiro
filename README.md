# Fluxo - Controle de gastos

Aplicação web para acompanhar uma receita mensal, os gastos acumulados e o limite diário planejado ao longo de 30 dias.

Também inclui uma tela de metas que calcula quanto guardar por mês, apresenta a evolução acumulada e ajusta os centavos finais para atingir exatamente o valor desejado no prazo escolhido.

## Interface visual
<img width="1262" height="593" alt="image" src="https://github.com/user-attachments/assets/5eef0e91-b739-4e0a-9ae8-cdec1d8654a2" />
<img width="1261" height="593" alt="image" src="https://github.com/user-attachments/assets/ec9430c7-e32a-4840-b0b0-45e2607a3ae8" />
<img width="1262" height="593" alt="image" src="https://github.com/user-attachments/assets/e16a4a27-b07e-42e8-8f95-6e500d3e5798" />

## Como executar

1. Copie `.env.example` para `.env` e informe sua conexão do MongoDB.
2. Instale as dependências com `npm install`.
3. Inicie com `npm start`.
4. Acesse `http://localhost:3000`.

## Regras principais

- Restante total = receita mensal − gastos do mês.
- Limite diário = receita mensal ÷ 30.
- Restante planejado do dia = receita mensal − (limite diário × número do dia).
- Saldo diário = restante total − restante planejado do dia.

Os valores são calculados internamente em centavos para evitar erros de ponto flutuante.
