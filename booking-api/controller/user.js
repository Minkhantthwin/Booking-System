const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

function issueToken(user) {
  return jwt.sign(
    {
      userId: user.user_id,
      email: user.email,
      role: {
        id: user.role_id,
        name: user.role?.name
      }
    },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

async function register(req, res) {
  try {
    const { role_id, email, phone, password, name } = req.body;
    if (!role_id || !email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { role_id, email, phone, password_hash, name },
      select: {
        user_id: true,
        role_id: true,
        email: true,
        phone: true,
        name: true,
        status: true,
        created_at: true,
        role: { select: { name: true } }
      }
    });
    const token = issueToken(user);
    res.status(201).json({ user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: 'Email and password are required' });

    const userRecord = await prisma.user.findUnique({
      where: { email },
      select: {
        user_id: true,
        role_id: true,
        email: true,
        phone: true,
        name: true,
        status: true,
        created_at: true,
        password_hash: true,
        role: { select: { name: true } }
      }
    });
    if (!userRecord)
      return res.status(401).json({ msg: 'Invalid credentials' });

    const match = await bcrypt.compare(password, userRecord.password_hash);
    if (!match)
      return res.status(401).json({ msg: 'Invalid credentials' });

    const token = issueToken(userRecord);
    const user = {
      user_id: userRecord.user_id,
      role_id: userRecord.role_id,
      email: userRecord.email,
      phone: userRecord.phone,
      name: userRecord.name,
      status: userRecord.status,
      created_at: userRecord.created_at,
      role: userRecord.role
    };
    res.json({ user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Login failed' });
  }
}

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.userId },
      select: {
        user_id: true,
        role_id: true,
        email: true,
        phone: true,
        name: true,
        status: true,
        created_at: true
      }
    });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Profile fetch failed' });
  }
}

async function updateProfile(req, res) {
  const userIdToUpdate = req.user.userId;

  const roleName = req.user?.role?.name || req.user?.role;
  const isAdmin = roleName === 'Admin';

  const { role_id, email, phone, password, name, status } = req.body;

  const data = {};
  if (phone !== undefined) data.phone = phone;
  if (email !== undefined) data.email = email;
  if (name !== undefined) data.name = name;
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    data.password_hash = hash;
  }
  if (isAdmin) {
    if (role_id !== undefined) data.role_id = role_id;
    if (status !== undefined) data.status = status;
  }
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ msg: 'No updatable fields provided' });
  }
  try {
    const updated = await prisma.user.update({
      where: { user_id: userIdToUpdate },
      data,
      select: {
        user_id: true,
        role_id: true,
        email: true,
        phone: true,
        name: true,
        status: true,
        created_at: true
      }
    });
    res.json({ user: updated });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ msg: 'User not found' });
    console.error(e);
    res.status(500).json({ msg: 'Update failed' });
  }
}

async function deleteUser(req, res) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ msg: 'Invalid id' });

  const roleName = req.user?.role?.name || req.user?.role;
  const isAdmin = roleName === 'Admin';
  if (!isAdmin && req.user.userId !== id) {
    return res.status(403).json({ msg: 'Forbidden' });
  }

  try {
    await prisma.user.delete({ where: { user_id: id } });
    return res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ msg: 'User not found' });
    if (e.code === 'P2003') {
      return res.status(409).json({ msg: 'User has related records. Consider deactivating instead.' });
    }
    console.error(e);
    res.status(500).json({ msg: 'Delete failed' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  deleteUser
};