# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache \
    libc6-compat \
    vips-dev \
    build-base \
    python3 \
    pkgconfig
WORKDIR /app

# Copy package files from jump-to-recipe directory
COPY jump-to-recipe/package*.json ./
RUN npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Declare build arguments - these will be passed from docker-compose
ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG GOOGLE_ID
ARG GOOGLE_SECRET
ARG GITHUB_ID
ARG GITHUB_SECRET

# Promote ARGs to ENV so they're available during build
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV GOOGLE_ID=${GOOGLE_ID}
ENV GOOGLE_SECRET=${GOOGLE_SECRET}
ENV GITHUB_ID=${GITHUB_ID}
ENV GITHUB_SECRET=${GITHUB_SECRET}

# Set standard build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY jump-to-recipe/ .

# Build the application with real environment variables
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install runtime dependencies for sharp
RUN apk add --no-cache vips-dev

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy node_modules for runtime scripts (drizzle-kit, etc.)
COPY --from=builder /app/node_modules ./node_modules

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy package.json for npm scripts
COPY --from=builder /app/package.json ./package.json

# Copy drizzle config for database operations
COPY --from=builder /app/drizzle.config.js ./drizzle.config.js

# Copy database schema and migrations for drizzle-kit
COPY --from=builder /app/src/db ./src/db

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
