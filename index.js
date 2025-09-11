const express = require('express');
const app = express();
const port = 3000;

const prisma = require('./prismaClient');

const cors = require('cors');
app.use(cors());

const { userRouter } = require('./routers/user');
app.use("/user", userRouter);

app.get('/info', (req, res) => {
  res.json({msg: 'Booking app'});
});

const server = app.listen(port, () => {
  console.log(`Booking app listening at http://localhost:${port}`);
});

const gracefulShutdown = async () => {
    await prisma.$disconnect();
    server.close(()=>{
        console.log('Server closed');
        process.exit(0);
    });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
