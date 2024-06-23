FROM node:lts
WORKDIR /usr/src/app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
ENV NODE_ENV=production
ENV ORIGIN=http://localhost:3000
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["node", "build"]
