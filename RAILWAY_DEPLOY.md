# 🚀 Деплой на Railway - Пошаговая инструкция

## Шаг 1: Подготовка кода

Код уже готов к деплою! База данных автоматически переключится на PostgreSQL на Railway.

## Шаг 2: Загрузка на GitHub

```bash
git add .
git commit -m "Ready for Railway deployment"
git push
```

## Шаг 3: Деплой на Railway

### Вариант А: Через веб-интерфейс (Рекомендуется)

1. Открой [railway.app](https://railway.app)
2. Войди через GitHub
3. Нажми "New Project"
4. Выбери "Deploy from GitHub repo"
5. Найди свой репозиторий `fuzzy-auron`
6. Нажми "Deploy"

### Вариант Б: Через CLI

```bash
# Установи Railway CLI (если еще не установлен)
npm install -g @railway/cli

# Войди в аккаунт
railway login

# Инициализируй проект
railway init

# Задеплой
railway up
```

## Шаг 4: Добавь PostgreSQL базу данных

1. В Railway проекте нажми "New"
2. Выбери "Database" → "Add PostgreSQL"
3. Railway автоматически создаст переменную `DATABASE_URL`
4. Перезапусти сервис (он автоматически подключится к PostgreSQL)

## Шаг 5: Настрой переменные окружения (опционально)

В Railway → Variables добавь:

```
JWT_SECRET=твой_секретный_ключ_минимум_32_символа
NODE_ENV=production
```

## Шаг 6: Получи публичный URL

1. Перейди в Settings → Networking
2. Нажми "Generate Domain"
3. Скопируй URL типа: `https://fuzzy-auron.up.railway.app`

## 🎉 Готово!

Твой сайт теперь онлайн и работает с PostgreSQL!

---

## 🔄 Обновление сайта

Просто запуши изменения на GitHub:

```bash
git add .
git commit -m "Update"
git push
```

Railway автоматически задеплоит изменения!

---

## 📊 Мониторинг

- **Логи**: Railway Dashboard → Deployments → View Logs
- **Метрики**: Railway Dashboard → Metrics
- **База данных**: Railway Dashboard → PostgreSQL → Data

---

## ⚠️ Важные моменты

1. **База данных**: На Railway используется PostgreSQL, локально - SQLite
2. **Файлы**: Загруженные файлы (аватары, конфиги) не сохраняются между деплоями
3. **Бесплатный план**: $5 кредитов в месяц, хватает на ~500 часов работы

---

## 🐛 Проблемы?

### Ошибка подключения к базе
- Убедись, что добавил PostgreSQL в проект
- Проверь, что переменная `DATABASE_URL` создана автоматически

### Сайт не открывается
- Проверь логи: Railway Dashboard → Deployments → View Logs
- Убедись, что порт правильный (Railway использует переменную `PORT`)

### База данных пустая
- При первом запуске таблицы создаются автоматически
- Проверь логи на наличие ошибок инициализации

---

## 💡 Полезные команды Railway CLI

```bash
# Открыть проект в браузере
railway open

# Посмотреть логи
railway logs

# Посмотреть переменные
railway variables

# Подключиться к базе данных
railway connect postgres
```

---

## 🔗 Полезные ссылки

- [Railway Docs](https://docs.railway.app)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [GitHub Repo](https://github.com/Lox123JUSSY12345/fuzzy-auron)
