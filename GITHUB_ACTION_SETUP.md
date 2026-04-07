# 🤖 Настройка автоматического деплоя через GitHub Actions

## Что это даёт?

После настройки каждый `git push` будет автоматически деплоить сайт на Railway!

## 📝 Шаги настройки:

### 1. Получить Railway Token

1. Открой [railway.app/account/tokens](https://railway.app/account/tokens)
2. Нажми "Create Token"
3. Название: `GitHub Actions Deploy`
4. Скопируй токен (он показывается только один раз!)

### 2. Добавить токен в GitHub Secrets

1. Открой свой репозиторий: https://github.com/Lox123JUSSY12345/fuzzy-auron
2. Перейди в Settings → Secrets and variables → Actions
3. Нажми "New repository secret"
4. Name: `RAILWAY_TOKEN`
5. Value: вставь скопированный токен
6. Нажми "Add secret"

### 3. Создать проект на Railway (если ещё не создан)

1. Открой [railway.app/new](https://railway.app/new)
2. Нажми "Deploy from GitHub repo"
3. Выбери `Lox123JUSSY12345/fuzzy-auron`
4. Дождись первого деплоя

### 4. Связать проект с CLI (для GitHub Action)

Нужно получить Project ID:

1. Открой свой проект на Railway
2. Перейди в Settings
3. Скопируй "Project ID"
4. Добавь в GitHub Secrets:
   - Name: `RAILWAY_PROJECT_ID`
   - Value: твой Project ID

### 5. Обновить GitHub Action

Я уже создал файл `.github/workflows/railway-deploy.yml`

Теперь нужно добавить Project ID в workflow. Обнови файл:

```yaml
- name: Deploy to Railway
  run: railway up --service=web --detach
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 6. Запушить изменения

```bash
git add .
git commit -m "Add GitHub Actions for Railway deployment"
git push
```

### 7. Проверить деплой

1. Открой https://github.com/Lox123JUSSY12345/fuzzy-auron/actions
2. Увидишь запущенный workflow "Deploy to Railway"
3. Дождись завершения (зелёная галочка)
4. Сайт автоматически обновится на Railway!

## 🎉 Готово!

Теперь при каждом `git push` сайт будет автоматически деплоиться!

## 🔍 Troubleshooting

### Ошибка "Project not found"

Нужно связать проект. Добавь в workflow:

```yaml
- name: Link Railway Project
  run: railway link ${{ secrets.RAILWAY_PROJECT_ID }}
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Ошибка "Service not found"

Укажи имя сервиса:

```yaml
- name: Deploy to Railway
  run: railway up --service=fuzzy-auron
```

## 📞 Нужна помощь?

Если что-то не работает, напиши мне!
