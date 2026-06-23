require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const port = Number(process.env.PORT) || 3000;

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Defina MONGODB_URI no arquivo .env antes de iniciar.');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });
  app.listen(port, () => console.log(`Aplicação disponível em http://localhost:${port}`));
}

start().catch((error) => {
  console.error('Falha ao iniciar:', error.message);
  process.exitCode = 1;
});
