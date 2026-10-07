FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js serve.js ./
COPY api/ ./api/
COPY lib/ ./lib/
COPY skills/ ./skills/
COPY public/ ./public/
ENV PORT=8080 NODE_ENV=production
EXPOSE 8080
USER node
HEALTHCHECK --interval=15s --timeout=5s CMD node -e "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "serve.js"]
