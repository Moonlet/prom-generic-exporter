FROM node:14-alpine as builder

ADD build /app
WORKDIR /app
RUN npm install --production node-linux-x64@lts 


FROM alpine
COPY --from=builder /app /app
WORKDIR /app

CMD ["/app/prom-generic-exporter", "/config/config.yml"]