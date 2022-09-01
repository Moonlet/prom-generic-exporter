FROM node:14-alpine as builder
ADD build /app
RUN curl -L https://unpkg.com/@pnpm/self-installer | node
WORKDIR /app
RUN pnpm install --prod

FROM node:14-alpine
# ADD build /app
COPY --from=builder /app /app
WORKDIR /app

CMD ["node", "/app/index.js", "/config/config.yml"]