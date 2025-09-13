const prisma = require('../prismaClient');

async function createRole(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    const role = await prisma.role.create({ data: { name, description } });
    res.status(201).json({ role });
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ message: 'Role name already exists' });
    }
    console.error(e);
    res.status(500).json({ message: 'Create failed' });
  }
}

async function listRoles(_req, res) {
  const roles = await prisma.role.findMany({ orderBy: { role_id: 'asc' } });
  res.json({ roles });
}

async function getRoleById(req, res) {
  const id = parseInt(req.params.id);
  const role = await prisma.role.findUnique({ where: { role_id: id } });
  if (!role) return res.status(404).json({ message: 'Not found' });
  res.json({ role });
}

async function updateRole(req, res) {
  const id = parseInt(req.params.id);
  const { name, description } = req.body;
  try {
    const role = await prisma.role.update({
      where: { role_id: id },
      data: { name, description }
    });
    res.json({ role });
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ message: 'Role name already exists' });
    }
    if (e.code === 'P2025') {
      return res.status(404).json({ message: 'Not found' });
    }
    console.error(e);
    res.status(500).json({ message: 'Update failed' });
  }
}

async function deleteRole(req, res) {
  const id = parseInt(req.params.id);
  try {
    await prisma.role.delete({ where: { role_id: id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ message: 'Not found' });
    }
    console.error(e);
    res.status(500).json({ message: 'Delete failed' });
  }
}

module.exports = {
  createRole,
  listRoles,
  getRoleById,
  updateRole,
  deleteRole
};