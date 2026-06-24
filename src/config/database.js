const mongoose = require('mongoose');

let connectionPromise = null;

function hasMongoUri() {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim());
}

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!hasMongoUri()) {
    throw new Error('MONGODB_URI não foi configurada no ambiente do deploy.');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false
    }).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
  return mongoose.connection;
}

async function databaseMiddleware(_request, _response, next) {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { connectDatabase, databaseMiddleware, hasMongoUri };
