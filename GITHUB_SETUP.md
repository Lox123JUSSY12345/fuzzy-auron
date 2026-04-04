# Загрузка на GitHub

## Шаг 1: Создай репозиторий на GitHub

1. Перейди на https://github.com
2. Нажми на "+" в правом верхнем углу → "New repository"
3. Название: `auron-client-website` (или любое другое)
4. Описание: `Auron Client - Minecraft 1.21.4 Cheat Client Website`
5. Выбери: **Public** или **Private**
6. **НЕ** ставь галочки на "Add README" и "Add .gitignore"
7. Нажми "Create repository"

## Шаг 2: Подключи локальный репозиторий

Скопируй и выполни эти команды в терминале (замени `YOUR_USERNAME` на свой GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/auron-client-website.git
git branch -M main
git push -u origin main
```

## Шаг 3: Готово!

Твой репозиторий теперь на GitHub! 🎉

## Обновление репозитория

Когда внесешь изменения:

```bash
git add .
git commit -m "Описание изменений"
git push
```

## Важно!

⚠️ Файлы в `.gitignore` НЕ загружаются на GitHub:
- `node_modules/` - зависимости (устанавливаются через `npm install`)
- `database.sqlite` - база данных (создается автоматически)
- `.env` - секретные ключи

## Клонирование на другой компьютер

```bash
git clone https://github.com/YOUR_USERNAME/auron-client-website.git
cd auron-client-website
npm install
npm start
```
