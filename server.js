const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Инициализация базы данных
db.initDatabase();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// База данных пользователей (замените на настоящую БД)
// Пароль для всех: password123
// УДАЛЕНО - теперь используется PostgreSQL база данных

// Главный endpoint для авторизации (поддержка обоих форматов)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, email, login, statement } = req.body;
    
    // Поддержка разных полей (для лоадера и сайта)
    const loginField = username || email || login || statement;
    
    console.log('Login attempt:', loginField);

    if (!loginField || !password) {
      return res.json({
        success: false,
        message: 'Введите логин и пароль',
        reason: 'Введите логин и пароль'
      });
    }

    // Поиск пользователя в базе данных
    const user = await db.getUserByLogin(loginField);

    if (!user) {
      console.log('User not found:', loginField);
      return res.status(401).json({
        success: false,
        message: 'Неверный логин или пароль',
        reason: 'Неверный логин или пароль'
      });
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Invalid password for:', loginField);
      return res.status(401).json({
        success: false,
        message: 'Неверный пароль',
        reason: 'Неверный логин или пароль'
      });
    }

    // Успешный вход
    console.log('Login successful:', user.username);
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Успешный вход',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        login: user.username, // Для совместимости с сайтом
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url || `https://minotar.net/avatar/${user.username}/48.png`,
        created_at: user.created_at,
        token: token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: 'Ошибка сервера'
    });
  }
});

// Альтернативные endpoints для совместимости с сайтом
app.post('/api/v1/auth/signin', async (req, res) => {
  // Преобразуем формат сайта в формат API
  const { statement, password } = req.body;
  req.body = {
    username: statement,
    password: password
  };
  
  try {
    const { username, password } = req.body;
    const loginField = username;
    
    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        reason: 'Введите логин и пароль',
        error: 'Введите логин и пароль'
      });
    }

    const user = await db.getUserByLogin(loginField);

    if (!user) {
      return res.status(401).json({
        success: false,
        reason: 'Неверный логин или пароль',
        error: 'Неверный логин или пароль'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        reason: 'Неверный логин или пароль',
        error: 'Неверный логин или пароль'
      });
    }

    const token = generateToken(user);
    
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        login: user.username,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      reason: 'Ошибка сервера'
    });
  }
});

app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const { login, email, password } = req.body;

    if (!login || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Заполните все поля'
      });
    }

    const exists = await db.userExists(login, email);

    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким логином или email уже существует'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.createUser(login, email, hashedPassword, 'Пользователь');

    if (!newUser) {
      return res.status(500).json({
        success: false,
        error: 'Ошибка создания пользователя'
      });
    }

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      token: token,
      user: {
        id: newUser.id,
        login: newUser.username,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка регистрации'
    });
  }
});

app.post('/api/signin', (req, res) => {
  req.url = '/api/auth/login';
  return app._router.handle(req, res);
});

app.post('/api/login', (req, res) => {
  req.url = '/api/auth/login';
  return app._router.handle(req, res);
});

app.post('/signin', (req, res) => {
  req.url = '/api/auth/login';
  return app._router.handle(req, res);
});

app.post('/login', (req, res) => {
  req.url = '/api/auth/login';
  return app._router.handle(req, res);
});

// Endpoint для регистрации
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.json({
        success: false,
        message: 'Заполните все поля'
      });
    }

    // Проверка существования пользователя
    const exists = await db.userExists(username, email);

    if (exists) {
      return res.json({
        success: false,
        message: 'Пользователь уже существует'
      });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание нового пользователя
    const newUser = await db.createUser(username, email, hashedPassword, 'Пользователь');

    if (!newUser) {
      return res.json({
        success: false,
        message: 'Ошибка создания пользователя'
      });
    }

    console.log('New user registered:', username);

    res.json({
      success: true,
      message: 'Регистрация успешна',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка регистрации'
    });
  }
});

// Тестовый endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'API работает!',
    timestamp: new Date().toISOString(),
endpoints: [
  'POST /api/auth/login',
  'POST /api/auth/register',
  'POST /api/v1/auth/signin',    // ← ДОБАВЬ ЭТУ СТРОКУ
  'POST /api/v1/auth/signup',    // ← ДОБАВЬ ЭТУ СТРОКУ
  'POST /api/signin',
  'POST /api/login',
  'GET /api/test',
  'GET /api/users'
]

  });
});

// Список пользователей (для тестирования)
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({
      users: users.map(u => ({
        username: u.username,
        email: u.email,
        role: u.role,
        created_at: u.created_at
      })),
      total: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Ошибка получения пользователей'
    });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Страница входа
app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'signin.html'));
});

// Страница регистрации
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

// Генерация токена
function generateToken(user) {
  const payload = `${user.id}:${user.username}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint не найден',
    path: req.path,
    method: req.method
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Auron Client API Server          ║
║   Port: ${PORT}                           ║
║   Status: Running                      ║
╚════════════════════════════════════════╝

Endpoints:
  POST /api/auth/login
  POST /api/auth/register
  GET  /api/test
  GET  /api/users

Test users:
  - test / password123 (Плюс)
  - admin / password123 (Админ)
  - user / password123 (Пользователь)
  `);
});
