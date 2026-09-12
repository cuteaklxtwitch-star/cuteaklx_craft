FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY . .
RUN npm i --omit=dev --no-audit --no-fund && cat dist.tar.gz.part-* | tar -xz && rm -f dist.tar.gz.part-* *.zip
EXPOSE 8080
CMD ["node", "server.js"]
