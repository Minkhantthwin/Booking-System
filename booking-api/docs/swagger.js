const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Booking API',
      version: '1.0.0',
      description: 'Booking service API'
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
    }
  },
  apis: [
    './routers/*.js',
    './docs/paths/*.yaml',
    './docs/components/*.yaml']
};

module.exports = swaggerJsdoc(options);