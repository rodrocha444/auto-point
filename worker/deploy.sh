#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🔐 Injetando segredos no Cloudflare Worker a partir do .dev.vars..."

if [ ! -f .dev.vars ]; then
  echo "❌ Arquivo .dev.vars não encontrado."
  exit 1
fi

export $(grep -v "^#" .dev.vars | xargs)

echo "$TURSO_DATABASE_URL" | pnpm exec wrangler secret put TURSO_DATABASE_URL
echo "$TURSO_AUTH_TOKEN" | pnpm exec wrangler secret put TURSO_AUTH_TOKEN
echo "$VAPID_PUBLIC_KEY" | pnpm exec wrangler secret put VAPID_PUBLIC_KEY
echo "$VAPID_PRIVATE_KEY" | pnpm exec wrangler secret put VAPID_PRIVATE_KEY
echo "$VAPID_SUBJECT" | pnpm exec wrangler secret put VAPID_SUBJECT

echo "🚀 Fazendo deploy do Worker..."
pnpm exec wrangler deploy

echo "✅ Worker publicado com sucesso!"
