const express = require('express');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbGet, dbRun, dbAll } = require('../database/db-helper');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Настройка multer для загрузки аватарок
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.userId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'));
    }
  }
});

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

router.get('/account/details', authMiddleware, async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      id: user.id,
      login: user.login,
      email: user.email,
      role: user.role,
      group: user.group_name,
      createdAt: new Date(user.created_at).toLocaleDateString('ru-RU'),
      banned: user.banned === 1,
      status: user.status === 1,
      avatarUrl: user.avatar_url || '/img/default-avatar.svg',
      gauthStatus: user.gauth_enabled === 1 ? 'true' : 'false',
      hwid: user.hwid,
      ram: user.ram.toString(),
      subuntill: user.sub_until,
      version: user.version
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/account/update-ram', authMiddleware, async (req, res) => {
  const { ram } = req.body;

  if (!ram || ram < 512 || ram > 16384) {
    return res.status(400).json({ error: 'Некорректное значение RAM' });
  }

  try {
    await dbRun('UPDATE users SET ram = ? WHERE id = ?', [ram, req.userId]);
    res.json({ success: true, ram });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при обновлении' });
  }
});

router.post('/account/setup-2fa', authMiddleware, async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.gauth_enabled) {
      return res.status(400).json({ error: '2FA уже настроен' });
    }

    const secret = speakeasy.generateSecret({
      name: `Auron Client (${user.login})`
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    await dbRun('UPDATE users SET gauth_secret = ? WHERE id = ?', [secret.base32, req.userId]);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка генерации QR кода' });
  }
});

router.post('/account/verify-2fa', authMiddleware, async (req, res) => {
  const { code } = req.body;

  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user.gauth_secret) {
      return res.status(400).json({ error: '2FA не настроен' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.gauth_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Неверный код' });
    }

    await dbRun('UPDATE users SET gauth_enabled = 1 WHERE id = ?', [req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при активации' });
  }
});

router.post('/account/disable-2fa', authMiddleware, async (req, res) => {
  const { code } = req.body;

  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user.gauth_enabled) {
      return res.status(400).json({ error: '2FA не активирован' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.gauth_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Неверный код' });
    }

    await dbRun('UPDATE users SET gauth_enabled = 0, gauth_secret = NULL WHERE id = ?', [req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при отключении' });
  }
});

router.post('/account/activate-key', authMiddleware, async (req, res) => {
  const { key } = req.body;

  if (!key || key.trim().length === 0) {
    return res.status(400).json({ error: 'Введите ключ' });
  }

  try {
    const keyData = await dbGet('SELECT * FROM activation_keys WHERE key_code = ?', [key.trim()]);

    if (!keyData) {
      return res.status(404).json({ error: 'Ключ не найден' });
    }

    if (keyData.used === 1) {
      return res.status(400).json({ error: 'Ключ уже использован' });
    }

    const newSubDate = new Date();
    newSubDate.setDate(newSubDate.getDate() + keyData.duration_days);
    const subUntil = newSubDate.toLocaleDateString('ru-RU');

    await dbRun('UPDATE users SET role = ?, sub_until = ? WHERE id = ?', [keyData.role, subUntil, req.userId]);
    await dbRun('UPDATE activation_keys SET used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE key_code = ?', [req.userId, key.trim()]);

    res.json({
      success: true,
      role: keyData.role,
      subUntil: subUntil,
      message: `Ключ активирован! Роль: ${keyData.role}, подписка до: ${subUntil}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/avatar/:id', (req, res) => {
  const defaultAvatar = require('path').join(__dirname, '../../img/logo.png');
  res.sendFile(defaultAvatar, (err) => {
    if (err) {
      res.status(404).send('Avatar not found');
    }
  });
});

router.get('/download/loader', authMiddleware, async (req, res) => {
  try {
    const user = await dbGet('SELECT role FROM users WHERE id = ?', [req.userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const role = user.role.toLowerCase();
    if (role === 'user' || role === 'default') {
      return res.status(403).json({ error: 'Требуется активная подписка для скачивания' });
    }
    
    const loaderPath = require('path').join(__dirname, '../../rockstar-1.0.0.jar');
    
    if (!fs.existsSync(loaderPath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    res.download(loaderPath, 'auron-client-1.0.0.jar');
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/account/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  try {
    // Удаляем старую аватарку если она есть
    const user = await dbGet('SELECT avatar_url FROM users WHERE id = ?', [req.userId]);
    
    if (user && user.avatar_url && user.avatar_url !== '/img/default-avatar.svg') {
      const oldAvatarPath = path.join(__dirname, '../..', user.avatar_url);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Обновляем URL аватарки в базе
    await dbRun('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.userId]);
    res.json({ success: true, avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при сохранении' });
  }
});

module.exports = router;
