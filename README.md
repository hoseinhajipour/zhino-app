# کلینیک ژینو

اپ React + Express با ذخیره‌سازی روی **MySQL** خود هاست (بدون Firebase).

## اجرای محلی

1. MySQL را روشن کنید و در `.env` تنظیمات را بگذارید (از روی `.env.example`).
2. نصب وابستگی‌ها:
   ```bash
   npm install
   ```
3. توسعه (API روی `:3001` و Vite روی `:3000`):
   ```bash
   npm run dev
   ```

## CLI و MCP مدیریت سایت

برای مدیریت صفحه‌ساز، تنظیمات، پزشکان، FAQ و فرم‌ها از ترمینال یا Cursor:

1. در `.env` یک توکن بگذارید (وقتی ست شود، نوشتن روی `/api` فقط با این توکن مجاز است):
   ```env
   ZHINO_API_TOKEN=your-secret-token
   ZHINO_API_BASE=http://127.0.0.1:3001
   VITE_ZHINO_API_TOKEN=your-secret-token
   ```
2. سرور را روشن کنید (`npm run dev`).
3. CLI:
   ```bash
   npm run zhino -- health
   npm run zhino -- pages list
   npm run zhino -- blocks get page home
   npm run zhino -- capabilities --page-kind site
   npm run zhino -- --help
   ```
4. MCP برای Cursor: فایل `.cursor/mcp.json` از قبل تنظیم شده؛ بعد از restart Cursor سرور `zhino` را در MCP ببینید. ابزارهایی مثل `get_capabilities`, `get_blocks`, `replace_blocks`, `list_pages` در دسترس‌اند.

`VITE_ZHINO_API_TOKEN` همان مقدار توکن است تا پنل ادمین در مرورگر وقتی توکن سرور فعال است بتواند ذخیره کند.

## دیپلوی روی هاست اشتراکی Node.js

1. در پنل هاست یک دیتابیس MySQL بسازید.
2. فایل `.env` را با مقادیر هاست پر کنید.
3. روی سرور:
   ```bash
   npm install
   npm run build
   npm start
   ```
4. پوشه `uploads/` باید قابل نوشتن باشد.

نقطه ورود پروداکشن: `npm start` (Express هم API و هم فایل‌های `dist` را سرو می‌کند).
