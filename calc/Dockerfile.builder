FROM node:22-alpine

RUN apk add --no-cache git curl

WORKDIR /app

CMD ["sleep", "infinity"]
