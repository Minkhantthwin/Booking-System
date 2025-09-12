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
      schemas: {
        UserPublic: {
          type: 'object',
            properties: {
              user_id: { type: 'integer' },
              role_id: { type: 'integer' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string', nullable: true },
              name: { type: 'string' },
              status: { type: 'string', enum: ['active', 'inactive'] },
              created_at: { type: 'string', format: 'date-time' }
            }
        }
      }
    }
  },
  apis: [
    './routers/*.js',
    './docs/paths/*.yaml',
    './docs/components/*.yaml']
};

module.exports = swaggerJsdoc(options);