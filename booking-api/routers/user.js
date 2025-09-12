const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const prisma = require('../prismaClient');

router.post('/register', async (req, res) => {
  try {
    const { role_id, email, phone, password, name } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    // Create user
    const user = await prisma.user.create({
      data: {
        role_id,
        email,
        phone,
        password_hash,
        name,
      }
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ msg: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (!user) {
        return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, 'secret');
    res.json({ token });
});

module.exports = {userRouter: router};