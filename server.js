require('dotenv').config();

const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { createTransfer } = require('./routes/transfers');
const { getUserFromToken, loginUser, logoutUser, registerUser, requireAdmin } = require('./auth');
const { createUser, deleteUserById, ensureAdminUser, listUsers } = require('./users');
const { getTransfers } = require('./database/transfers');

const PORT = process.env.PORT || 3000;
const ROOT_DIRECTORY = path.resolve(__dirname, '..');
const sslEnabled = Boolean(process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH);
const app = express();

const adminSetup = ensureAdminUser({
  firstName: process.env.ADMIN_FIRST_NAME,
  lastName: process.env.ADMIN_LAST_NAME,
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD
});

if (adminSetup.error) {
  console.error(`Administrateur non créé : ${adminSetup.error}`);
}

app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.options('*', (request, response) => {
  response.sendStatus(204);
});

app.use(express.json({ limit: '1mb' }));

function getBearerToken(request) {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

function adminOnly(request, response, next) {
  const admin = requireAdmin(getBearerToken(request));
  if (!admin) {
    response.status(403).json({ error: 'Accès réservé à un administrateur.' });
    return;
  }

  request.admin = admin;
  next();
}

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok', service: 'ISM SAWKI API' });
});

app.get('/api/transactions', (request, response) => {
  response.json({ transactions: getTransfers() });
});

app.post('/api/auth/register', (request, response) => {
  const data = request.body;
  const result = registerUser({
    firstName: data.firstName || data.first_name,
    lastName: data.lastName || data.last_name,
    email: data.email,
    password: data.password,
    role: data.role || data.account_type || 'principal'
  });

  response.status(result.error ? 400 : 201).json(result);
});

app.post('/api/auth/login', (request, response) => {
  const result = loginUser(request.body);
  response.status(result.error ? 401 : 200).json(result);
});

app.get('/api/auth/me', (request, response) => {
  const user = getUserFromToken(getBearerToken(request));
  response.status(user ? 200 : 401).json(user ? { user } : { error: 'Session invalide ou expirée.' });
});

app.post('/api/auth/logout', (request, response) => {
  const loggedOut = logoutUser(getBearerToken(request));
  response.json({ message: loggedOut ? 'Déconnexion réussie.' : 'Session déjà fermée.' });
});

app.get('/api/admin/users', adminOnly, (request, response) => {
  response.json({ users: listUsers() });
});

app.post('/api/admin/users', adminOnly, (request, response) => {
  const result = createUser({
    firstName: request.body.firstName,
    lastName: request.body.lastName,
    email: request.body.email,
    password: request.body.password,
    role: 'user'
  });

  response.status(result.error ? 400 : 201).json(result);
});

app.delete('/api/admin/users/:id', adminOnly, (request, response) => {
  if (request.params.id === request.admin.id) {
    response.status(400).json({ error: 'Un administrateur ne peut pas supprimer son propre compte.' });
    return;
  }

  const deleted = deleteUserById(request.params.id);
  response.status(deleted ? 200 : 404).json({
    message: deleted ? 'Membre supprimé.' : 'Membre introuvable.'
  });
});

app.post('/api/transfers', (request, response) => {
  const result = createTransfer(request.body);

  if (result.error) {
    response.status(400).json(result);
    return;
  }

  response.status(201).json({ message: 'Transfert créé avec succès.', transfer: result.transfer });
});

app.use(express.static(ROOT_DIRECTORY));

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    response.status(400).json({ error: 'Le corps de la requête doit être un JSON valide.' });
    return;
  }

  response.status(error.status || 500).json({ error: error.message || 'Erreur interne du serveur.' });
});

const server = sslEnabled
  ? https.createServer({
      key: fs.readFileSync(path.resolve(process.env.SSL_KEY_PATH)),
      cert: fs.readFileSync(path.resolve(process.env.SSL_CERT_PATH))
    }, app)
  : http.createServer(app);

server.listen(PORT, () => {
  const protocol = sslEnabled ? 'https' : 'http';
  console.log(`ISM SAWKI backend disponible sur ${protocol}://localhost:${PORT}`);
});

module.exports = app;
