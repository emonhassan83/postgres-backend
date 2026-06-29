FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache bash dumb-init

COPY nodemailer/package.json ./
COPY nodemailer/tsconfig.json ./
RUN corepack enable && pnpm install

COPY nodemailer/ ./
RUN pnpm run build

EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["pnpm", "run", "start"]
