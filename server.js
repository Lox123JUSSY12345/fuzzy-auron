const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./api/routes/auth');
const accountRoutes = require('./api/routes/account');
const configsRoutes = require('./api/routes/configs');
const paymentRoutes = require('./api/routes/payment');
const adminRoutes = require('./api/routes/admin');
const { initDatabase } = require('./api/database/db');
const { dbGet, dbRun } = require('./api/database/db-helper');

const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', accountRoutes);
app.use('/api/v1', configsRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/api/v1', adminRoutes);

// Middleware для проверки админ-сессии
app.get('/:sessionUrl.html', async (req, res, next) => {
  const sessionUrl = req.params.sessionUrl;
  
  try {
    const session = await dbGet(
      `SELECT * FROM admin_sessions WHERE session_url = ? AND expires_at > datetime('now')`,
      [sessionUrl]
    );
    
    if (session) {
      res.sendFile(path.join(__dirname, 'admin-panel.html'));
    } else {
      next();
    }
  } catch (err) {
    console.error('Error checking admin session:', err);
    next();
  }
});

app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'signin.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/purchase', (req, res) => {
  res.sendFile(path.join(__dirname, 'purchase.html'));
});

app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'faq.html'));
});

app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment-success.html'));
});

let currentAdminUrl = '';

app.get('/api/v1/admin/get-link', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  res.json({
    adminUrl: `${protocol}://${host}/${currentAdminUrl}.html`,
    expiresIn: '24 hours'
  });
});

initDatabase().then(async () => {
  const crypto = require('crypto');
  const sessionUrl = crypto.randomBytes(8).toString('hex');
  currentAdminUrl = sessionUrl;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  try {
    await dbRun(
      `INSERT INTO admin_sessions (session_url, expires_at) VALUES (?, ?)`,
      [sessionUrl, expiresAt.toISOString()]
    );
  } catch (err) {
    console.error('❌ Ошибка создания админ-сессии:', err);
  }

  app.listen(PORT, () => {
    console.log(`\n✅ Сервер запущен!`);
    console.log(`Сайт: http://localhost:${PORT}`);
    console.log(`Эндпоинты: http://localhost:${PORT}/api/v1`);
    console.log(`Админ-панель: http://localhost:${PORT}/${sessionUrl}.html`);
    console.log(`Получить админ-ссылку: http://localhost:${PORT}/api/v1/admin/get-link\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
