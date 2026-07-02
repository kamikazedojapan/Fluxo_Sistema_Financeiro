const mongoose = require('mongoose');

const connectionCache = globalThis.__mongooseConnectionCache || {
  connection: null,
  promise: null,
};

globalThis.__mongooseConnectionCache = connectionCache;

let listenersConfigured = false;

function hasMongoUri() {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim());
}

function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    readyState: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState] || 'unknown',
  };
}

function configureConnectionListeners() {
  if (listenersConfigured) return;

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Conectado com sucesso.');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Conexão encerrada.');
  });

  mongoose.connection.on('error', (error) => {
    console.error('[MongoDB] Erro de conexão:', error.message);
  });

  listenersConfigured = true;
}

async function connectDatabase() {
  configureConnectionListeners();

  if (!hasMongoUri()) {
    throw new Error('MONGODB_URI não foi configurada no ambiente.');
  }

  if (mongoose.connection.readyState === 1) {
    connectionCache.connection = mongoose.connection;
    return connectionCache.connection;
  }

  if (!connectionCache.promise) {
    mongoose.set('bufferCommands', false);

    connectionCache.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
        autoIndex: process.env.NODE_ENV !== 'production',
      })
      .then(() => mongoose.connection)
      .catch((error) => {
        connectionCache.promise = null;
        throw error;
      });
  }

  connectionCache.connection = await connectionCache.promise;

  return connectionCache.connection;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    connectionCache.connection = null;
    connectionCache.promise = null;
  }
}

async function databaseMiddleware(_request, _response, next) {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  databaseMiddleware,
  hasMongoUri,
  getConnectionStatus,
};