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
