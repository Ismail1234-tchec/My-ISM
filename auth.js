const crypto = require('crypto');
const {
  createUser,
  findUserByEmail,
  findUserById,
  publicUser,
  verifyPassword
} = require('./users');

const sessions = new Map();

function registerUser(userData) {
  return createUser(userData);
}

function loginUser({ email, password }) {
  const user = findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: 'E-mail ou mot de passe incorrect.' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, user.id);

  return {
    token,
    user: publicUser(user)
  };
}

function getUserFromToken(token) {
  const userId = sessions.get(token);
  if (!userId) {
    return null;
  }

  const user = findUserById(userId);
  return user ? publicUser(user) : null;
}

function logoutUser(token) {
  return sessions.delete(token);
}

function requireAdmin(token) {
  const userId = sessions.get(token);
  const user = userId ? findUserById(userId) : null;
  return user && user.role === 'admin' ? publicUser(user) : null;
}

module.exports = {
  getUserFromToken,
  loginUser,
  logoutUser,
  requireAdmin,
  registerUser
};
