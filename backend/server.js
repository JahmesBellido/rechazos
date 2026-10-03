const express = require('express');
const session = require('express-session');
const cors = require('cors');
const KnexSessionStore = require('connect-session-knex')(session);
const knex = require('knex');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const transportistasRoutes = require('./routes/transportistas');
const uploadRoutes = require('./routes/upload');
const documentosRoutes = require('./routes/documentos');
const importDocumentosRoutes = require('./routes/importDocumentos');
const rechazosRoutes = require('./routes/rechazos');
const importRechazosRoutes = require('./routes/importRechazos');
const dashboardRoutes = require('./routes/dashboard');
const analisisRoutes = require('./routes/analisis');
const importAnalisisRoutes = require('./routes/importAnalisis');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

const sslEnabled = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';
const dbSsl = sslEnabled
  ? (process.env.DB_CA_CERT && fs.existsSync(process.env.DB_CA_CERT)
      ? { ca: fs.readFileSync(process.env.DB_CA_CERT), rejectUnauthorized: true }
      : { rejectUnauthorized: false })
  : undefined;

// Knex instance for session store
const knexInstance = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8',
    ...(dbSsl ? { ssl: dbSsl } : {})
  }
});

const store = new KnexSessionStore({
  knex: knexInstance,
  tablename: 'sessions',
  createTable: true,
  clearInterval: 60000
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1|\d{1,3}(\.\d{1,3}){3})(:\d+)?$/.test(origin);
    if (isLocal || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true', // true en producción con HTTPS
    sameSite: 'lax'
  }
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/transportistas', transportistasRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/documentos', importDocumentosRoutes);
app.use('/api/rechazos', rechazosRoutes);
app.use('/api/rechazos', importRechazosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analisis', analisisRoutes);
app.use('/api/analisis', importAnalisisRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Frontend compilado (frontend/dist)
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
