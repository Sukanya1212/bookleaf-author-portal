import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const secret = process.env.JWT_SECRET || 'bookleaf_super_secret_jwt_key_2026_eval';
    const token = jwt.sign(
      {
        id: user.id,
        authorId: user.authorId,
        email: user.email,
        name: user.name,
        role: user.role
      },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        authorId: user.authorId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
        joinedDate: user.joinedDate
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

export async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        authorId: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        role: true,
        joinedDate: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function getDemoUsers(req, res) {
  try {
    const authors = await prisma.user.findMany({
      where: { role: 'AUTHOR' },
      select: {
        id: true,
        authorId: true,
        name: true,
        email: true,
        city: true,
        _count: { select: { books: true, tickets: true } }
      },
      orderBy: { authorId: 'asc' }
    });

    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return res.json({ authors, admin });
  } catch (err) {
    console.error('getDemoUsers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
