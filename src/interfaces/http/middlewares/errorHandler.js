function getStatusCode(error) {
  if (error.statusCode) return error.statusCode;
  if (error instanceof TypeError) return 400;
  if (error.name === 'ValidationError') return 400;
  if (error.name === 'CastError') return 400;
  return 500;
}

function errorHandler(error, _request, response, _next) {
  const status = getStatusCode(error);

  if (status >= 500) {
    console.error(error);
  }

  response.status(status).json({
    message:
      status >= 500
        ? 'Não foi possível concluir a operação no servidor.'
        : error.message,
    detail: process.env.NODE_ENV === 'production' ? undefined : error.message,
  });
}

module.exports = {
  errorHandler,
};