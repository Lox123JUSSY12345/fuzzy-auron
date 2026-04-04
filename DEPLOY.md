# 🚀 Деплой Auron Client на бесплатный хостинг

## Вариант 1: Render.com (Рекомендуется)

### Шаг 1: Подготовка
1. Создай аккаунт на [render.com](https://render.com)
2. Создай репозиторий на [GitHub](https://github.com)

### Шаг 2: Загрузка кода на GitHub
```bash
git init
git add .
git commit -m "Initial commit - Auron Client"
git branch -M main
git remote add origin https://github.com/ВАШ_ЮЗЕРНЕЙМ/auron-client.git
git push -u origin main
```

### Шаг 3: Деплой на Render
1. Зайди на [render.com](https://render.com)
2. Нажми "New +" → "Web Service"
3. Подключи свой GitHub репозиторий
4. Настройки:
   - **Name**: auron-client
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
5. Нажми "Create Web Service"

### Шаг 4: Готово!
Твой сайт будет доступен по адресу: `https://auron-client.onrender.com`

⚠️ **Важно**: На бесплатном плане сервер засыпает после 15 минут неактивности. Первая загрузка может занять 30-60 секунд.

---

## Вариант 2: Railway.app

### Шаг 1: Подготовка
1. Создай аккаунт на [railway.app](https://railway.app)
2. Загрузи код на GitHub (см. выше)

### Шаг 2: Деплой
1. Зайди на [railway.app](https://railway.app)
2. Нажми "New Project" → "Deploy from GitHub repo"
3. Выбери свой репозиторий
4. Railway автоматически определит Node.js проект
5. Нажми "Deploy"

### Шаг 3: Настройка домена
1. Перейди в Settings → Networking
2. Нажми "Generate Domain"
3. Твой сайт будет доступен по адресу: `https://auron-client.up.railway.app`

---

## Вариант 3: Vercel (Только для статики)

⚠️ **Внимание**: Vercel не поддерживает SQLite базу данных. Подходит только если убрать функции регистрации/авторизации.

### Шаг 1: Установка Vercel CLI
```bash
npm install -g vercel
```

### Шаг 2: Деплой
```bash
vercel
```

Следуй инструкциям в терминале.

---

## Вариант 4: Glitch.com

### Шаг 1: Подготовка
1. Зайди на [glitch.com](https://glitch.com)
2. Нажми "New Project" → "Import from GitHub"

### Шаг 2: Импорт
1. Вставь ссылку на свой GitHub репозиторий
2. Glitch автоматически задеплоит проект
3. Твой сайт будет доступен по адресу: `https://auron-client.glitch.me`

---

## Рекомендации

### Для продакшена:
1. **Render.com** - лучший баланс между бесплатностью и функциональностью
2. **Railway.app** - $5/месяц бесплатно, быстрее чем Render

### Для тестирования:
1. **Glitch.com** - самый быстрый деплой, но сервер засыпает быстро
2. **Vercel** - только для статики без бэкенда

---

## Проблемы и решения

### Сервер засыпает
**Решение**: Используй сервис типа [UptimeRobot](https://uptimerobot.com) для пинга сайта каждые 5 минут

### База данных не работает
**Решение**: 
- На Render/Railway используй PostgreSQL вместо SQLite
- Или используй внешний сервис типа [Supabase](https://supabase.com)

### Видео не загружается
**Решение**: Загрузи видео на CDN типа [Cloudinary](https://cloudinary.com) или YouTube

---

## Быстрый старт (Render.com)

```bash
# 1. Инициализация Git
git init
git add .
git commit -m "Initial commit"

# 2. Создай репозиторий на GitHub и загрузи код
git remote add origin https://github.com/USERNAME/auron-client.git
git push -u origin main

# 3. Зайди на render.com и подключи репозиторий
# 4. Готово! Сайт будет доступен через 2-3 минуты
```

---

## Полезные ссылки

- [Render.com](https://render.com)
- [Railway.app](https://railway.app)
- [Vercel](https://vercel.com)
- [Glitch.com](https://glitch.com)
- [GitHub](https://github.com)
