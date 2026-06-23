# Controle de gastos

Aplicação web para acompanhar uma receita mensal, os gastos acumulados e o limite diário planejado ao longo de 30 dias.

Também inclui uma tela de metas que calcula quanto guardar por mês, apresenta a evolução acumulada e ajusta os centavos finais para atingir exatamente o valor desejado no prazo escolhido.

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
