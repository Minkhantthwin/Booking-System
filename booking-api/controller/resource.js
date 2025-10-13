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

async function updateResource(req, res) {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ message: 'Valid resource ID required' });
    }
    const { name, description, status } = req.body;
    const data = {};
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'Valid name required' });
        }
        data.name = name;
    }
    if (description !== undefined) {
        if (typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({ message: 'Valid description required' });
        }
        data.description = description;
    }
    if (status !== undefined) {
        const allowedStatuses = ['available', 'unavailable'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        data.status = status;
    }
    if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }
    try {
        const resource = await prisma.resource.update({ where: { resource_id: id }, data });
        res.status(200).json({ resource });
    } catch (e) {
        if (e.code === 'P2025') {
            return res.status(404).json({ message: 'Resource Not Found' });
        }
        if (e.code === 'P2002') {
            return res.status(409).json({ message: 'Resource name already exists' });
        }
        console.error(e);
        res.status(500).json({ message: 'Resource update failed' });
    }
}

async function deleteResource(req, res) {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ message: 'Valid resource ID required' });
    }
    try {
        await prisma.resource.delete({ where: { resource_id: id } });
        res.status(204).send();
    } catch (e) {
        if (e.code === 'P2025') {
            return res.status(404).json({ message: 'Resource Not Found' });
        }
        console.error(e);
        res.status(500).json({ message: 'Resource deletion failed' });
    }
}

module.exports = {
    createResource,
    getAllResources,
    getResourceById,
    updateResource,
    deleteResource
};