const prisma = require('../prismaClient');

async function createService(req, res) {
    try {
        const { name, description, price, duration_min } = req.body;
        if (!name) return res.status(400).json({ message: 'name required' });
        if (price == null || isNaN(price) || price < 0) {
            return res.status(400).json({ message: 'Valid price required' });
        }
        if (duration_min == null || isNaN(duration_min) || duration_min <= 0) {
            return res.status(400).json({ message: 'Valid duration_min required' });
        }
        const service = await prisma.service.create({ data: { name, description, price, duration_min } });
        res.status(201).json({ service });
    }

    catch (e){
        if (e.code === 'P2002'){
            return res.status(409).json({ message: 'Service name already exists' });
        }
        console.error(e);
        res.status(500).json({ message: 'Create failed' });
    }
}

async function getAllServices(req, res) {
    try {
        const services = await prisma.service.findMany();
        res.status(200).json({ services });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Get all services failed' });
    }
}

async function getServiceById(req, res) {
    const id = parseInt(req.params.id);
    try {
        const service = await prisma.service.findUnique({ where: { service_id: id } });
        if (!service) return res.status(404).json({ message: 'Not found' });
        res.status(200).json({ service });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Get service by ID failed' });
    }
}

module.exports = {
    createService,
    getAllServices,
    getServiceById
};