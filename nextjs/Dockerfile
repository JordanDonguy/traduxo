# /nextjs/Dockerfile
FROM node:lts AS builder

WORKDIR /app

# Copy package.json
COPY package*.json ./

# Copy nextjs package.json and lock
COPY nextjs/package*.json nextjs/

# Copy shared packages
COPY packages ./packages

# Copy Next.js source
COPY nextjs/. ./nextjs

# Install dependencies
RUN npm install

# Build Next.js
RUN npm run build:web

# Production image
FROM node:lts

# Copy build artifacts from /app/nextjs
COPY --from=builder /app/nextjs/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/nextjs/.next ./.next
COPY --from=builder /app/nextjs/prisma ./prisma
COPY --from=builder /app/nextjs/public ./public

EXPOSE 3000
CMD ["npm", "start"]
