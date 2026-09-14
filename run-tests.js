const assert = require('assert/strict');
const {
  getUserFromToken,
  loginUser,
  logoutUser,
  registerUser
} = require('../Backend/auth');
const { normalizeEmail, verifyPassword } = require('../Backend/users');
const { createTransfer } = require('../Backend/routes/transfers');
const { getTransfers } = require('../Backend/database/transfers');

function test(name, callback) {
  try {
    callback();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

test('normalise une adresse e-mail', () => {
  assert.equal(normalizeEmail('  TEST@Example.COM '), 'test@example.com');
});

test('inscrit un utilisateur sans exposer son mot de passe', () => {
  const result = registerUser({
    firstName: 'Awa',
    lastName: 'Diop',
    email: `awa-${Date.now()}@example.com`,
    password: 'motdepasse123'
  });

  assert.ok(result.user);
  assert.equal(result.user.firstName, 'Awa');
  assert.equal(result.user.passwordHash, undefined);
});

test('crée les comptes principal et agent', () => {
  const principal = registerUser({
    firstName: 'Awa',
    lastName: 'Principal',
    email: `principal-${Date.now()}@example.com`,
    password: 'motdepasse123',
    role: 'principal'
  });
  const agent = registerUser({
    firstName: 'Moussa',
    lastName: 'Agent',
    email: `agent-${Date.now()}@example.com`,
    password: 'motdepasse123',
    role: 'agent'
  });

  assert.equal(principal.user.role, 'principal');
  assert.equal(agent.user.role, 'agent');
});

test('refuse un type de compte inconnu', () => {
  const result = registerUser({
    firstName: 'Fatou',
    lastName: 'Test',
    email: `role-${Date.now()}@example.com`,
    password: 'motdepasse123',
    role: 'inconnu'
  });

  assert.ok(result.error);
});

test('connecte un utilisateur et gère sa session', () => {
  const email = `moussa-${Date.now()}@example.com`;
  registerUser({ firstName: 'Moussa', lastName: 'Sarr', email, password: 'motdepasse123' });

  const login = loginUser({ email, password: 'motdepasse123' });
  assert.ok(login.token);
  assert.equal(getUserFromToken(login.token).email, email);
  assert.equal(logoutUser(login.token), true);
  assert.equal(getUserFromToken(login.token), null);
});

test('refuse un mot de passe incorrect', () => {
  const email = `fatou-${Date.now()}@example.com`;
  registerUser({ firstName: 'Fatou', lastName: 'Ndiaye', email, password: 'motdepasse123' });

  assert.ok(loginUser({ email, password: 'incorrect' }).error);
});

test('refuse un transfert avec un montant invalide', () => {
  const result = createTransfer({ beneficiary: 'Awa Diop', amount: 0 });
  assert.ok(result.error);
});

test('charge les transactions depuis la base locale', () => {
  const transfers = getTransfers();
  assert.ok(Array.isArray(transfers));
});

console.log('Tous les tests sont réussis.');
