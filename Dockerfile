# Stage 1: Base & Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables for Next.js public config
ARG NEXT_PUBLIC_SOROBAN_RPC_URL
ARG NEXT_PUBLIC_NETWORK_PASSPHRASE
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_IPFS_GATEWAY
ARG NEXT_PUBLIC_CONTRACT_ADDRESS
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_GIT_SHA

ENV NEXT_PUBLIC_SOROBAN_RPC_URL=${NEXT_PUBLIC_SOROBAN_RPC_URL} \
    NEXT_PUBLIC_NETWORK_PASSPHRASE=${NEXT_PUBLIC_NETWORK_PASSPHRASE} \
    NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL} \
    NEXT_PUBLIC_IPFS_GATEWAY=${NEXT_PUBLIC_IPFS_GATEWAY} \
    NEXT_PUBLIC_CONTRACT_ADDRESS=${NEXT_PUBLIC_CONTRACT_ADDRESS} \
    NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION} \
    NEXT_PUBLIC_GIT_SHA=${NEXT_PUBLIC_GIT_SHA} \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
