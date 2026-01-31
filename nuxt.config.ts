export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 4
  },
  devtools: { enabled: true },
  runtimeConfig: {
    replicateApiToken: process.env.REPLICATE_API_TOKEN,
    webhookSecret: process.env.WEBHOOK_SECRET,
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  },
  nitro: {
    preset: 'vercel'
  }
})
