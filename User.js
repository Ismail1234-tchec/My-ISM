const crypto = require('crypto');

class User {
  constructor({ firstName, lastName, email, passwordHash, role = 'user', id = crypto.randomUUID(), createdAt = new Date().toISOString() }) {
    if (!firstName || !lastName || !email || !passwordHash) {
      throw new Error('Les informations utilisateur sont incomplètes.');
    }

    this.id = id;
    this.firstName = String(firstName).trim();
    this.lastName = String(lastName).trim();
    this.email = String(email).trim().toLowerCase();
    this.passwordHash = passwordHash;
    this.role = ['admin', 'principal', 'agent', 'user'].includes(role) ? role : 'user';
    this.createdAt = createdAt;
  }

  toPublicJSON() {
    const { passwordHash, ...publicUser } = this;
    return publicUser;
  }
}

module.exports = User;
