FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .
RUN mkdir -p /app/data/accounts && chown -R node:node /app

USER node
ENV NODE_ENV=production
ENV PORT=3433
EXPOSE 3433
CMD ["npm", "start"]
