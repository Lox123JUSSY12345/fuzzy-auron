# 🚂 Инструкция по деплою на Railway

## ✅ Что уже сделано:

1. ✓ Код загружен на GitHub: `https://github.com/Lox123JUSSY12345/fuzzy-auron`
2. ✓ Railway CLI установлен
3. ✓ Авторизация в Railway выполнена (taslykovr044@gmail.com)
4. ✓ Конфигурация Railway готова (`railway.json`, `railway.toml`)

## 🎯 Следующие шаги:

### Вариант 1: Через веб-интерфейс (РЕКОМЕНДУЕТСЯ)

1. Открой [railway.app/new](https://railway.app/new)
2. Нажми "Deploy from GitHub repo"
3. Выбери репозиторий `Lox123JUSSY12345/fuzzy-auron`
4. Railway автоматически:
   - Обнаружит Node.js проект
   - Прочитает `railway.json` и `railway.toml`
   - Запустит `npm install`
   - Запустит `node server.js`
5. Перейди в Settings → Networking → Generate Domain
6. Готово! Сайт будет доступен по адресу типа: `https://fuzzy-auron.up.railway.app`

### Вариант 2: Через CLI (если веб-интерфейс не работает)

Открой НОВЫЙ терминал и выполни:

```bash
cd C:\Users\ssqj\Desktop\rockstar.pub
railway init
# Выбери workspace
# Создай новый проект или выбери существующий
railway up
```

### Вариант 3: Автоматический деплой через GitHub Actions

Создам GitHub Action для автоматического деплоя при каждом push.

## 🔧 Настройка переменных окружения

После деплоя добавь переменные в Railway:

1. Открой проект на Railway
2. Перейди в Variables
3. Добавь:
   - `PORT` = 8081 (или оставь пустым, Railway сам установит)
   - `JWT_SECRET` = твой секретный ключ
   - `NODE_ENV` = production

## 📊 Мониторинг

После деплоя:
- Логи: `railway logs`
- Статус: `railway status`
- Открыть в браузере: `railway open`

## ⚠️ Важно для базы данных

SQLite на Railway работает, но данные могут теряться при редеплое.
Для продакшена рекомендуется:
1. Добавить PostgreSQL: `railway add -d postgres`
2. Или настроить Volume (уже есть в `railway.toml`)

## 🔗 Полезные ссылки

- Твой GitHub: https://github.com/Lox123JUSSY12345/fuzzy-auron
- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.com
