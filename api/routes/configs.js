const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbGet, dbRun, dbAll } = require('../database/db-helper');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

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

const hasSubscription = async (req, res, next) => {
  try {
    const user = await dbGet('SELECT role FROM users WHERE id = ?', [req.userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const role = user.role.toLowerCase();
    if (role === 'user' || role === 'default') {
      return res.status(403).json({ error: 'Требуется активная подписка' });
    }
    
    next();
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const uploadsDir = path.join(__dirname, '../../uploads/configs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadsDir, req.userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.json', '.txt', '.cfg', '.ini'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый формат файла'));
    }
  }
});

router.get('/configs', authMiddleware, hasSubscription, async (req, res) => {
  try {
    const configs = await dbAll(
      'SELECT id, name, file_size, created_at, updated_at FROM configs WHERE user_id = ? ORDER BY updated_at DESC',
      [req.userId]
    );
    
    const formattedConfigs = configs.map(config => ({
      id: config.id,
      name: config.name,
      fileSize: config.file_size,
      createdAt: new Date(config.created_at).toLocaleDateString('ru-RU'),
      updatedAt: new Date(config.updated_at).toLocaleDateString('ru-RU')
    }));
    
    res.json({ configs: formattedConfigs });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки конфигов' });
  }
});

router.post('/configs/upload', authMiddleware, hasSubscription, upload.single('config'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  
  const configName = req.body.name || req.file.originalname;
  
  try {
    const result = await dbRun(
      'INSERT INTO configs (user_id, name, file_path, file_size) VALUES (?, ?, ?, ?)',
      [req.userId, configName, req.file.path, req.file.size]
    );
    
    res.json({
      success: true,
      config: {
        id: result.lastID,
        name: configName,
        fileSize: req.file.size,
        createdAt: new Date().toLocaleDateString('ru-RU')
      }
    });
  } catch (err) {
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Ошибка сохранения конфига' });
  }
});

router.get('/configs/:id/download', authMiddleware, hasSubscription, async (req, res) => {
  try {
    const config = await dbGet(
      'SELECT * FROM configs WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    
    if (!config) {
      return res.status(404).json({ error: 'Конфиг не найден' });
    }
    
    if (!fs.existsSync(config.file_path)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    res.download(config.file_path, config.name);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/configs/:id', authMiddleware, hasSubscription, async (req, res) => {
  try {
    const config = await dbGet(
      'SELECT * FROM configs WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    
    if (!config) {
      return res.status(404).json({ error: 'Конфиг не найден' });
    }
    
    if (fs.existsSync(config.file_path)) {
      fs.unlinkSync(config.file_path);
    }
    
    await dbRun('DELETE FROM configs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

router.put('/configs/:id/rename', authMiddleware, hasSubscription, async (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Введите название' });
  }
  
  try {
    const result = await dbRun(
      'UPDATE configs SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [name.trim(), req.params.id, req.userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Конфиг не найден' });
    }
    
    res.json({ success: true, name: name.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка переименования' });
  }
});

module.exports = router;
