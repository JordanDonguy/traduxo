# 🌍 Traduxo — AI Translation & Expression App

**Traduxo** is a modern web application that helps users go beyond basic translation.  
It provides **native-like translations, idiomatic expressions, cultural explanations, and real usage examples** powered by **Gemini API**.  

With features like **voice input, auto language detection, and personal history**, Traduxo is designed for anyone who wants to **learn, practice, and master expressions across languages**.

---

## 🚀 Live Demo

👉 [https://traduxo.app](https://traduxo.app)

---

## ✨ Features

- 🌎 ```Smart AI Translations``` — Powered by **Gemini API**, offering natural, native-like results with multiple alternatives.  
- 💡 ```Expression Suggestions``` — Get idiomatic expressions with translations and alternative phrasings.  
- 📖 ```Explanations Mode``` — Learn the **origin, meaning, nuance, and tone** of an expression with **3 real-world examples**.  
- 🗣️ ```Voice Input``` — Speak directly to request translations.  
- 🕵️ ```Auto Language Detection``` — Automatically detects source language.  
- 🔐 ```User Accounts``` — Login with **Google OAuth** (via NextAuth).  
- 🗄️ ```History & Favorite``` — Store translations and suggestions in history or favorites.  
- 🌐 ```Choose Explanation Language``` — Control the language used for expression explanations.  
- 📱 ```Responsive UI``` — Works seamlessly on desktop and mobile.  
- 🌙 ```Light/Dark themes``` - Light and dark themes available for user's visual comfort

---

## ⚙️ How It Works

1. ```Translate``` — Enter text (or speak) → Gemini API returns natural translations + alternatives.  
2. ```Suggest``` — Request an expression → Gemini provides idioms with translation + alternatives.  
3. ```Explain``` — Ask for context → Gemini explains the expression’s origin, nuance, and tone with **3 real usage examples**.  
4. ```Save``` — Logged-in users can save results to **history** or **favorites** for later.  
5. ```Learn``` — Explanations can be delivered in the user’s preferred language.  

---

## 🛠️ Tech Stack

- ```Next.js``` — React framework for SSR, routing, API routes and performance  
- ```TypeScript``` — Strict typing for maintainable development  
- ```Gemini API``` — AI engine powering translations, suggestions, and explanations (currently using Gemini 2.5 Flash-Lite model)
- ```NextAuth.js``` — Authentication with Google OAuth and Credentials methods
- ```Prisma``` — ORM for database access and type-safe queries 
- ```Neon``` — PostgreSQL database hosting
- ```Zod``` — Type-safe schema validation for inputs  
- ```sanitize-html``` — Secures user input against XSS  
- ```Upstash Redis``` — In-memory database used for IP-based daily user request limits
- ```Tailwind CSS``` — Utility-first CSS framework for styling  
- ```CSS``` — CSS transformations and optimizations  
- ```next-themes``` — Handles light and dark theme switching for user interface
- ```React-toastify``` — Displays toast notifications for user feedback and alerts
- ```Jest``` — Unit and integration testing framework
- ```Vercel``` — Hosting and deployment platform  
- ```Cloudflare``` — Provides CDN, SSL, caching, and security protection for the app

---

## 📁 Project Structure
```
traduxo/
├── app/                     # Next.js App Router pages & layouts
│   ├── api/                 # API routes (Supabase, Gemini)
├── components/              # Reusable UI components
├── lib/
│   ├── client/              # Frontend client logic
│   │   ├── hooks/           # Custom hooks for client
│   │   └── utils/           # Utility functions
│   ├── server/              # Backend logic
│   │   ├── auth/            # Authentication helpers
│   │   ├── handlers/        # API route handlers
│   │   └── middlewares/     # Express/Next middlewares
│   └── shared/              # Shared code: Gemini prompts & Zod schemas
├── types/                   # TypeScript type definitions
├── context/                 # React context for global state
└── tests/                   # Jest unit tests
```


---

## 📄 License

This project is proprietary software.  
All rights reserved.  

See [LICENSE](./LICENSE) for full details.

---

## 👤 Author

Developed by [Jordan Donguy](https://github.com/JordanDonguy)
