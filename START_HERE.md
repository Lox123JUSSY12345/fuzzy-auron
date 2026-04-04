# 🎮 Auron Client - Быстрый старт

## 📋 Что нужно сделать

### 1️⃣ Создать аккаунт на GitHub
1. Перейди на [github.com](https://github.com)
2. Нажми "Sign up"
3. Создай аккаунт

### 2️⃣ Создать репозиторий
1. Нажми "+" в правом верхнем углу → "New repository"
2. Название: `auron-client`
3. Описание: `Auron Client - Minecraft 1.21.4 Cheat`
4. Выбери "Public" или "Private"
5. НЕ добавляй README, .gitignore, license
6. Нажми "Create repository"

### 3️⃣ Загрузить код на GitHub

Открой терминал в папке проекта и выполни:

```bash
git init
git add .
git commit -m "Initial commit - Auron Client"
git branch -M main
git remote add origin https://github.com/ВАШ_ЮЗЕРНЕЙМ/auron-client.git
git push -u origin main
```

**Замени `ВАШ_ЮЗЕРНЕЙМ` на свой GitHub username!**

### 4️⃣ Создать аккаунт на Render.com
1. Перейди на [render.com](https://render.com)
2. Нажми "Get Started"
3. Войди через GitHub

### 5️⃣ Задеплоить сайт
1. На Render нажми "New +" → "Web Service"
2. Нажми "Connect account" и разреши доступ к GitHub
3. Найди репозиторий `auron-client` и нажми "Connect"
4. Настройки:
   - **Name**: `auron-client` (или любое другое)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. Нажми "Create Web Service"

### 6️⃣ Готово! 🎉

Через 2-3 минуты твой сайт будет доступен по адресу:
```
https://auron-client.onrender.com
```

(или другое имя, которое ты выбрал)

---

## 🔄 Как обновить сайт

После изменений в коде:

### Вариант 1: Через bat файл (Windows)
Просто запусти `deploy.bat` и следуй инструкциям

### Вариант 2: Вручную
```bash
git add .
git commit -m "Описание изменений"
git push
```

Render автоматически задеплоит новую версию через 2-3 минуты!

---

## ⚠️ Важные моменты

### Бесплатный план Render:
- ✅ 750 часов в месяц (достаточно для одного сайта)
- ⚠️ Сервер засыпает после 15 минут неактивности
- ⚠️ Первая загрузка после сна занимает 30-60 секунд
- ✅ Автоматический HTTPS
- ✅ Автоматический деплой при push в GitHub

### Как избежать засыпания:
Используй [UptimeRobot](https://uptimerobot.com):
1. Создай аккаунт
2. Добавь свой сайт для мониторинга
3. Установи проверку каждые 5 минут
4. Сервер будет всегда активен!

---

## 🆘 Проблемы?

### Сайт не открывается
- Подожди 2-3 минуты после деплоя
- Проверь логи на Render (вкладка "Logs")

### Ошибка при git push
```bash
git config --global user.email "your@email.com"
git config --global user.name "Your Name"
```

### База данных не работает
SQLite на Render работает, но данные удаляются при каждом деплое.
Для продакшена используй PostgreSQL (бесплатно на Render).

---

## 📞 Контакты

- Telegram: https://t.me/auronclient
- Discord: https://discord.gg/auronclient
- VK: https://vk.com/auronclient

---

**Удачи! 🚀**
