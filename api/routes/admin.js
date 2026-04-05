const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { dbGet, dbRun, dbAll } = require('../database/db-helper');

// Генерация случайного URL для админки
function generateAdminUrl() {
    return crypto.randomBytes(6).toString('hex');
}

// Создание новой админ-сессии
router.post('/admin/create-session', async (req, res) => {
    try {
        const { adminPassword } = req.body;
        
        // Простая проверка пароля (в продакшене используй env переменную)
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (adminPassword !== ADMIN_PASSWORD) {
            return res.status(403).json({ error: 'Неверный пароль' });
        }

        const sessionUrl = generateAdminUrl();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Сессия на 24 часа

        await dbRun(
            `INSERT INTO admin_sessions (session_url, expires_at) VALUES (?, ?)`,
            [sessionUrl, expiresAt.toISOString()]
        );

        res.json({
            success: true,
            adminUrl: `/${sessionUrl}.html`,
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Проверка валидности админ-сессии
router.get('/admin/verify-session/:sessionUrl', async (req, res) => {
    try {
        const { sessionUrl } = req.params;

        const session = await dbGet(
            `SELECT * FROM admin_sessions WHERE session_url = ? AND expires_at > datetime('now')`,
            [sessionUrl]
        );

        if (!session) {
            return res.status(403).json({ valid: false });
        }

        res.json({ valid: true });

    } catch (error) {
        console.error('Verify session error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Генерация ключей активации
router.post('/admin/generate-keys', async (req, res) => {
    try {
        const { sessionUrl, role, count, durationDays } = req.body;

        // Проверяем сессию
        const session = await dbGet(
            `SELECT * FROM admin_sessions WHERE session_url = ? AND expires_at > datetime('now')`,
            [sessionUrl]
        );

        if (!session) {
            return res.status(403).json({ error: 'Недействительная сессия' });
        }

        // Генерируем ключи
        const keys = [];
        const keyCount = parseInt(count) || 1;
        const duration = parseInt(durationDays) || 30;

        for (let i = 0; i < keyCount; i++) {
            const keyCode = `${role.toUpperCase()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
            
            await dbRun(
                `INSERT INTO activation_keys (key_code, role, duration_days) VALUES (?, ?, ?)`,
                [keyCode, role, duration]
            );
            
            keys.push(keyCode);
        }

        res.json({ success: true, keys });

    } catch (error) {
        console.error('Generate keys error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Создание промокода
router.post('/admin/create-promocode', async (req, res) => {
    try {
        const { sessionUrl, code, discountPercent, maxUses, expiresAt } = req.body;

        // Проверяем сессию
        const session = await dbGet(
            `SELECT * FROM admin_sessions WHERE session_url = ? AND expires_at > datetime('now')`,
            [sessionUrl]
        );

        if (!session) {
            return res.status(403).json({ error: 'Недействительная сессия' });
        }

        await dbRun(
            `INSERT INTO promocodes (code, discount_percent, max_uses, expires_at) VALUES (?, ?, ?, ?)`,
            [code.toUpperCase(), discountPercent, maxUses || 0, expiresAt || null]
        );

        res.json({ success: true, code: code.toUpperCase() });

    } catch (error) {
        console.error('Create promocode error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение списка промокодов
router.get('/admin/promocodes/:sessionUrl', async (req, res) => {
    try {
        const { sessionUrl } = req.params;

        // Проверяем сессию
        const session = await dbGet(
            `SELECT * FROM admin_sessions WHERE session_url = ? AND expires_at > datetime('now')`,
            [sessionUrl]
        );

        if (!session) {
            return res.status(403).json({ error: 'Недействительная сессия' });
        }

        const promocodes = await dbAll(
            `SELECT * FROM promocodes ORDER BY created_at DESC`,
            []
        );

        res.json({ promocodes });

    } catch (error) {
        console.error('Get promocodes error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение статистики
router.get('/admin/stats/:sessionUrl', async (req, res) => {
    try {
        const { sessionUrl } = req.params;

        // Проверяем сессию
        const session = await dbGet(
            `SELECT * FROM admin_sessions WHERE session_url = ? AND expires_at > datetime('now')`,
            [sessionUrl]
        );

        if (!session) {
            return res.status(403).json({ error: 'Недействительная сессия' });
        }

        // Получаем статистику
        const usersCount = await dbGet(`SELECT COUNT(*) as total FROM users`, []);
        const unusedKeys = await dbGet(`SELECT COUNT(*) as total FROM activation_keys WHERE used = 0`, []);
        const paidInvoices = await dbGet(`SELECT COUNT(*) as total FROM invoices WHERE status = 'paid'`, []);
        const totalRevenue = await dbGet(`SELECT SUM(amount) as total FROM invoices WHERE status = 'paid'`, []);

        res.json({
            users: usersCount?.total || 0,
            unusedKeys: unusedKeys?.total || 0,
            paidInvoices: paidInvoices?.total || 0,
            totalRevenue: totalRevenue?.total || 0
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение списка пользователей
router.get('/admin/users/:sessionUrl', async (req, res) => {
    try {
        const { sessionUrl } = req.params;

        const session = await dbGet(
            `SELECT * FROM admin_sessions WHERE session_url = ? AND expires_at > datetime('now')`,
            [sessionUrl]
        );

        if (!session) {
            return res.status(403).json({ error: 'Недействительная сессия' });
        }

        const users = await dbAll(
            `SELECT id, login, email, role, sub_until, created_at, banned FROM users ORDER BY created_at DESC`,
            []
        );

        res.json({ users });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление пользователя
router.post('/admin/update-user', async (req, res) => {
    try {
        const { sessionUrl, userId, role, subUntil, banned } = req.body;

        const session = await dbGet(
            `SELECT * FROM admin_sessions WHERE session_url = ? AND expires_at > datetime('now')`,
            [sessionUrl]
        );

        if (!session) {
            return res.status(403).json({ error: 'Недействительная сессия' });
        }

        await dbRun(
            `UPDATE users SET role = ?, sub_until = ?, banned = ? WHERE id = ?`,
            [role, subUntil, banned ? 1 : 0, userId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление пользователя
router.post('/admin/delete-user', async (req, res) => {
    try {
        const { sessionUrl, userId } = req.body;

        const session = await dbGet(
            `SELECT * FROM admin_sessions WHERE session_url = ? AND expires_at > datetime('now')`,
            [sessionUrl]
        );

        if (!session) {
            return res.status(403).json({ error: 'Недействительная сессия' });
        }

        await dbRun(
            `DELETE FROM users WHERE id = ?`,
            [userId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Проверка промокода
router.post('/payment/check-promocode', async (req, res) => {
    try {
        const { code } = req.body;

        const promo = await dbGet(
            `SELECT * FROM promocodes WHERE code = ? AND active = 1 AND (expires_at IS NULL OR expires_at > datetime('now')) AND (max_uses = 0 OR used_count < max_uses)`,
            [code.toUpperCase()]
        );

        if (!promo) {
            return res.json({ valid: false, error: 'Промокод не найден или недействителен' });
        }

        res.json({
            valid: true,
            discount: promo.discount_percent
        });

    } catch (error) {
        console.error('Check promocode error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
