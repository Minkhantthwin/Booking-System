const prisma = require('../prismaClient');

async function createResource(req, res) {
    try {
        const { name, description } = req.body;
        if (!name || !description ) return res.status(400).json({ message: 'Missing required fields' });
        const resource = await prisma.resource.create({ data: { name, description } });
        res.status(201).json({ resource });
    }
    catch (e) {
        if (e.code === 'P2002'){
            return res.status(409).json({ message: 'Resource name already exists' });
        }
        console.error(e);
        res.status(500).json({message: 'Resource Creation failed'});
    }
}

async function getAllResources(req, res) {
    try {
        const resources = await prisma.resource.findMany();
        res.status(200).json({ resources });
    } 
    catch (e) {
        console.error(e);
        res.status(500).json({message: 'Get all resources failed'});
    }
}

async function getResourceById(req, res){
    const id = parseInt(req.params.id);
    try {
        const resource = await prisma.resource.findUnique({ where: {resource_id: id } });
        if (!resource) return res.status(404).json({ message: 'Not Found' });
        res.status(200).json({ resource });
    } catch (e) {
        console.error(e);
        res.status(500).json({message: 'Get Resource by ID faile '});
    }
}

module.exports = {
    createResource,
    getAllResources,
    getResourceById
};