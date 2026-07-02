function notImplemented(featureName) {
  return function handleNotImplemented(_request, response) {
    response.status(501).json({
      message: `${featureName} ainda não foi implementado nesta fase do projeto.`,
      status: 'not_implemented',
    });
  };
}

module.exports = {
  notImplemented,
};