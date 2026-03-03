# HomePilot frontend – build and run Next.js
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
# Use npm install so build works when lock file is out of sync (e.g. after adding @playwright/test).
# Run `npm install` locally and commit package-lock.json for reproducible builds, then switch to: RUN npm ci
RUN npm install
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
CMD ["node", "server.js"]
