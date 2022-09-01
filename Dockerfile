FROM node:14-alpine as builder

ADD build /app
WORKDIR /app
RUN npm install --omit=dev


# FROM node:14-alpine
# # ADD build /app
# COPY --from=builder /app /app
# WORKDIR /app

CMD ["/app/prom-generic-exporter", "/config/config.yml"]