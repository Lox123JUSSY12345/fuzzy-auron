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
  res.send(`
    <html>
      <head>
        <title>Auron Client API</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px;
            background: #1a1a1a;
            color: #e0e0e0;
          }
          h1 { color: #4A9EFF; }
          .endpoint { 
            background: #2a2a2a; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px;
            border-left: 4px solid #4A9EFF;
          }
          code { 
            background: #0a0a0a; 
            padding: 2px 6px; 
            border-radius: 4px;
            color: #4A9EFF;
          }
          .success { color: #4CAF50; }
          .warning { color: #FFA500; }
        </style>
      </head>
      <body>
        <h1>🚀 Auron Client API</h1>
        <p class="success">✅ API работает!</p>
        <p class="warning">⚠️ Для работы регистрации нужно добавить PostgreSQL базу данных в Railway</p>
        
        <h2>Доступные endpoints:</h2>
        
        <div class="endpoint">
          <strong>POST /api/auth/login</strong>
          <p>Авторизация пользователя</p>
          <code>{ "username": "test", "password": "password123" }</code>
        </div>
        
        <div class="endpoint">
          <strong>POST /api/auth/register</strong>
          <p>Регистрация нового пользователя</p>
          <code>{ "username": "newuser", "email": "user@mail.com", "password": "pass" }</code>
        </div>
        
        <div class="endpoint">
          <strong>GET /api/test</strong>
          <p>Проверка работы API</p>
        </div>
        
        <div class="endpoint">
          <strong>GET /api/users</strong>
          <p>Список пользователей</p>
        </div>
        
        <h2>📝 Регистрация:</h2>
        <p><a href="/signin" style="color: #4A9EFF;">Перейти на страницу регистрации</a></p>
      </body>
    </html>
  `);
});

// Страница регистрации
app.get('/signin', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Регистрация - Auron Client</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            color: #e0e0e0;
          }
          .container {
            background: #2a2a3e;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            width: 400px;
          }
          h1 {
            color: #4A9EFF;
            text-align: center;
            margin-bottom: 30px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 8px;
            color: #b0b0b0;
          }
          input {
            width: 100%;
            padding: 12px;
            border: 2px solid #3a3a4e;
            border-radius: 8px;
            background: #1a1a2e;
            color: #e0e0e0;
            font-size: 14px;
            box-sizing: border-box;
          }
          input:focus {
            outline: none;
            border-color: #4A9EFF;
          }
          button {
            width: 100%;
            padding: 14px;
            background: #4A9EFF;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
          }
          button:hover {
            background: #3a8eef;
            transform: translateY(-2px);
          }
          .message {
            margin-top: 20px;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            display: none;
          }
          .success {
            background: #4CAF50;
            color: white;
          }
          .error {
            background: #f44336;
            color: white;
          }
          .link {
            text-align: center;
            margin-top: 20px;
          }
          .link a {
            color: #4A9EFF;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Регистрация</h1>
          <form id="registerForm">
            <div class="form-group">
              <label>Имя пользователя</label>
              <input type="text" id="username" required>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="email" required>
            </div>
            <div class="form-group">
              <label>Пароль</label>
              <input type="password" id="password" required>
            </div>
            <button type="submit">Зарегистрироваться</button>
          </form>
          <div id="message" class="message"></div>
          <div class="link">
            <a href="/">← Вернуться на главную</a>
          </div>
        </div>

        <script>
          document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');

            try {
              const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
              });

              const data = await response.json();

              messageDiv.style.display = 'block';
              if (data.success) {
                messageDiv.className = 'message success';
                messageDiv.textContent = '✅ ' + data.message + ' Теперь можете войти в лоадер!';
                document.getElementById('registerForm').reset();
              } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = '❌ ' + data.message;
              }
            } catch (error) {
              messageDiv.style.display = 'block';
              messageDiv.className = 'message error';
              messageDiv.textContent = '❌ Ошибка подключения к серверу';
            }
          });
        </script>
      </body>
    </html>
  `);
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
