# راهنمای Deploy روی Cloudflare Pages

## مرحله ۱: فایل‌ها رو آماده کنید

فایل‌های پروژه باید این شکلی باشن:

```
oay-yaqin/
├── _worker.js          ← فایل جدید (Proxy)
├── index.html
├── admin.html
├── Amir1234.html
├── css/
│   └── style.css
├── js/
│   ├── config.js       ← آپدیت شده
│   ├── chat.js         ← آپدیت شده
│   └── admin.js
└── README.md
```

## مرحله ۲: Cloudflare Pages

1. برید به: https://dash.cloudflare.com
2. وارد اکانت بشید (یا بسازید - رایگانه)
3. از منوی سمت چپ: **Pages** → **Create a project**
4. **Connect to Git** → GitHub رو انتخاب کنید
5. ریپازیتوری `oay-yaqin` رو پیدا کنید و **Begin setup**

## مرحله ۳: تنظیمات Build

| تنظیم | مقدار |
|-------|-------|
| Project name | `oay-yaqin` |
| Production branch | `main` |
| Build command | خالی بذارید |
| Build output directory | `/` (ریشه) |

روی **Save and Deploy** بزنید.

## مرحله ۴: Environment Variables

1. توی پروژه → **Settings** → **Environment variables**
2. **Add variable**:
   - Name: `GROQ_API_KEY`
   - Value: `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`
3. Save

## مرحله ۵: Redeploy

1. توی **Deployments**
2. روی آخرین deploy کلیک کنید
3. **Retry deployment** یا **Trigger deployment**

## مرحله ۶: تست

لینک سایتتون:
```
https://oay-yaqin.pages.dev
```

بدون VPN تست کنید!

---

## نکات مهم:

- `_worker.js` باید توی ریشه پروژه باشه
- `config.js` و `chat.js` باید آپدیت شده باشن
- `netlify.toml` و پوشه `netlify/` رو پاک کنید
