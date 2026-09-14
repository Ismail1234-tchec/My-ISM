const crypto = require('crypto');
const User = require('../Domain/User');

const users = new Map();

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${passwordHash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash).split(':');
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function createUser({ firstName, lastName, email, password, role = 'user' }) {
  firstName = String(firstName || '').trim();
  lastName = String(lastName || '').trim();
  const normalizedEmail = normalizeEmail(email);

  if (!/^[\p{L}' -]{2,60}$/u.test(firstName) || !/^[\p{L}' -]{2,60}$/u.test(lastName) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !password) {
    return { error: 'Le prénom, le nom, l’e-mail et le mot de passe sont obligatoires.' };
  }

  if (String(password).length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' };
  }

  if (!['admin', 'principal', 'agent', 'user'].includes(role)) {
    return { error: 'Type de compte invalide.' };
  }

  if (users.has(normalizedEmail)) {
    return { error: 'Cette adresse e-mail est déjà utilisée.' };
  }

  const user = new User({
    firstName,
    lastName,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role
  });

  users.set(normalizedEmail, user);
  return { user: publicUser(user) };
}

function listUsers() {
  return Array.from(users.values(), publicUser);
}

function deleteUserById(id) {
  for (const [email, user] of users.entries()) {
    if (user.id === id) {
      users.delete(email);
      return true;
    }
  }

  return false;
}

function ensureAdminUser({ firstName, lastName, email, password }) {
  if (!firstName || !lastName || !email || !password) {
    return { skipped: true };
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    existingUser.role = 'admin';
    return { user: publicUser(existingUser), created: false };
  }

  const result = createUser({ firstName, lastName, email, password, role: 'admin' });
  return result.error ? result : { ...result, created: true };
}

function findUserByEmail(email) {
  return users.get(normalizeEmail(email));
}

function findUserById(id) {
  for (const user of users.values()) {
    if (user.id === id) {
      return user;
    }
  }

  return null;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  deleteUserById,
  ensureAdminUser,
  hashPassword,
  normalizeEmail,
  publicUser,
  verifyPassword
};
