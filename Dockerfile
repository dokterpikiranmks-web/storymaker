FROM node:20-alpine
WORKDIR /app

# Salin manifest dependensi
COPY package*.json ./

# Gunakan npm install dengan flag toleran terhadap lockfile & peer-deps
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Salin folder worker
COPY worker ./worker

# Jalankan daemon
CMD ["node", "worker/index.mjs"]
