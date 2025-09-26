FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy scripts and package.json for migrations
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/lib/db ./lib/db
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Install only production dependencies
RUN npm ci --only=production

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Create startup script that runs migrations first
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🔄 Running database migrations..."' >> /app/start.sh && \
    echo 'npm run db:migrate' >> /app/start.sh && \
    echo 'echo "🌱 Seeding database..."' >> /app/start.sh && \
    echo 'npm run db:seed' >> /app/start.sh && \
    echo 'echo "🚀 Starting application..."' >> /app/start.sh && \
    echo 'node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
