FROM node:22-alpine

WORKDIR /app

# Enable pnpm matching local version
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Disable minimum release age policy inside container
RUN pnpm config set minimum-release-age 0

# Copy package descriptors
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose dev server port
EXPOSE 3000

CMD ["pnpm", "dev"]
