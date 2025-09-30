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
- 🔐 ```User Accounts``` — Login with **Google OAuth** and persistent session with **JWT**.
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
- ```PostgreSQL``` — Relational database for persistent storage
- ```Prisma``` — ORM for database access and type-safe queries 
- ```JWT + Google OAuth``` — Authentication using JSON Web Tokens and Google OAuth for secure login
- ```Zod``` — Type-safe schema validation for inputs  
- ```sanitize-html``` — Secures user input against XSS  
- ```Tailwind CSS``` — Utility-first CSS framework for styling  
- ```CSS``` — CSS transformations and optimizations  
- ```next-themes``` — Handles light and dark theme switching for user interface
- ```React-toastify``` — Displays toast notifications for user feedback and alerts
- ```Jest``` — Unit and integration testing framework
- ```Docker``` — Containerized deployment for reproducible environments
- ```Hetzner VPS``` — Self-hosted server infrastructure
- ```Nginx``` — Reverse proxy for routing, SSL termination, and caching
- ```Cloudflare``` — Provides CDN, SSL, caching, and security protection for the app
- ```Upstash Redis``` — In-memory database used for IP-based daily user request limits


---

## 🖥️ Deployment

- Self-hosted on a `Hetzner VPS` using `Docker` for containerized deployment  
- `Nginx` as a reverse proxy, routing traffic to the app containers  
- `Certbot` is used to issue and automatically renew SSL certificates for HTTPS  
- `Cloudflare` for CDN, caching, and additional security protection  
- Monorepo structure: most front-end logic lives in `/packages` to prepare for an upcoming `React Native` version  
- Deployment is fully containerized and scalable, allowing easy updates and maintenance


---

## ⚡ CI/CD Pipeline

Traduxo uses a **self-hosted GitHub Actions runner** on the server (managed via `systemd`) to handle continuous integration and deployment.  

The pipeline is triggered on:

- Pushes to `main` branch  
- Pull requests targeting `main` (only the test branch would be triggered on pull requests)  
- Manual triggers (`workflow_dispatch`)

---

### 1️⃣ Test Job
- Runs on the self-hosted runner  
- Steps:
  1. Checkout code  
  2. Build the Docker test image (`nextjs/Dockerfile.test`)  
  3. Run linting and Jest unit tests inside the container  
  4. Remove the test image after completion  

This ensures that only code passing tests proceeds to deployment.

---

### 2️⃣ Deploy Job
- Runs **only on pushes to `main`** and depends on the `test` job  
- Steps:
  1. Checkout code  
  2. Log in to Docker Hub using secrets  
  3. Build the production Docker image (`nextjs/Dockerfile.prod`) with required build arguments  
  4. Push the Docker image to Docker Hub  
  5. SSH into the Hetzner server and perform deployment:
     - Backup the current container (`docker tag traduxo-app:latest traduxo-app:backup`)  
     - Pull the new image via `docker compose pull`  
     - Run Prisma migrations in a temporary container  
     - If migrations succeed, bring up the new version (`docker compose up -d`)  
     - Remove dangling images (`docker image prune -f`)  
     - If migrations fail, rollback to the backup image  

---

### 🔑 Notes
- All operations run inside Docker, ensuring consistent environments  
- The pipeline uses **secrets** for sensitive data like Docker Hub credentials, server SSH keys, and API base URLs
- Using self-hosted runner because server architecture is **ARM64**, avoiding slow build times with buildx or QEMU on GitHub Actions cloud runners


---

## 🏗️ Local Developer Guide

Follow these steps to set up and run Traduxo locally for development.

### 1️⃣ Clone the Repository
```bash
    git clone https://github.com/JordanDonguy/traduxo.git
    cd traduxo
```

### 2️⃣ Set Up Environment Variables
```bash
    cp nextjs/.env.example nextjs/.env.development
```

Then edit the files to set your environment variables

### 3️⃣ Start Development Containers
```bash
    docker compose -f docker-compose.dev.yml up -d
```

This will start:

- PostgreSQL  
- Traduxo app container  

### 4️⃣ View Application Logs
```bash
    docker logs -f traduxo-app-1
```

### 5️⃣ Run Tests & Lint

Inside /nextjs, there is a Dockerfile.test configured to run tests and linting:
```bash
    # Build and run the test container
    docker build -f nextjs/Dockerfile.test -t traduxo-test .
    docker run --rm traduxo-test
```

- `--rm` ensures the container is removed after running  
- This will execute Jest tests and linting in an isolated environment  

If you want to remove the test image after:
```bash
    docker rmi -f traduxo-test
```

### 6️⃣ Access the App

Once containers are running, the app should be available at:
```bash
    http://localhost:3000
```

### ✅ Notes

- Make sure Docker and Docker Compose are installed and running  
- Any changes to .env files require restarting the containers



---

## 📄 License

This project is proprietary software.  
All rights reserved.  

See [LICENSE](./LICENSE) for full details.


---

## 👤 Author

Developed by [Jordan Donguy](https://github.com/JordanDonguy)
