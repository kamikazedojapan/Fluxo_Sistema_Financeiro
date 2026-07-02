const {
    hasMongoUri,
    getConnectionStatus,
} = require('../../../config/database');

function getHealth(_request, response) {
    const connectionStatus =
    	typeof getConnectionStatus === 'function'
				? getConnectionStatus()
				: undefined;

		response.json({
			ok: true,
			mongodbConfigured: hasMongoUri(),
			mongodbConnection: connectionStatus,
			environment: process.env.NODE_ENV || 'development',
		});
}

module.exports = {
	getHealth
};