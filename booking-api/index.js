const express = require('express');
const app = express();

const prisma = require('./prismaClient');

const cors = require('cors');
app.use(cors());
app.use(express.json());

const { userRouter } = require('./routers/user');
app.use("/user", userRouter);

const { roleRouter } = require('./routers/role');
app.use("/role", roleRouter);

app.get('/info', (req, res) => {
  res.json({msg: 'Booking app'});
});

const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {explorer: true}));
app.get('/openapi.json', (req, res) => {
  res.json(openapiSpec);
});

const gracefulShutdown = async () => {
    await prisma.$disconnect();
    if (module.exports.server) {
        module.exports.server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

if (require.main === module) {
    const port = 3000;
    const server = app.listen(port, () => {
        console.log(`Booking app listening at http://localhost:${port}`);
    });
    module.exports.server = server;
}

module.exports = app;