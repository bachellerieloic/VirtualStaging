export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 4
  },
  devtools: { enabled: true },
  runtimeConfig: {
    replicateApiToken: process.env.REPLICATE_API_TOKEN,
    webhookSecret: process.env.WEBHOOK_SECRET,
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    cloudflareKvApiToken: process.env.CLOUDFLARE_KV_API_TOKEN,
    cloudflareKvNamespaceId: process.env.CLOUDFLARE_KV_NAMESPACE_ID,
    cloudflareR2ApiToken: process.env.CLOUDFLARE_R2_API_TOKEN,
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  },
  nitro: {
    preset: 'vercel'
  }
})
