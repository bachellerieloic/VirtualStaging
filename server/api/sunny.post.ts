import Replicate from 'replicate'
import { store } from '../utils/store'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body.image) {
    throw createError({ statusCode: 400, message: 'Image URL is required' })
  }

  const replicate = new Replicate({
    auth: config.replicateApiToken
  })

  const webhookUrl = `${config.public.appUrl}/api/webhook`

  // Use img2img for sky replacement / weather correction
  const prediction = await replicate.predictions.create({
    version: "a4a8bcfd6a211c88622a75f2a6a7186f40f89tried5f1aba8c97561e63f2e0a8a",
    input: {
      image: body.image,
      prompt: body.prompt || "same image but with bright blue sunny sky, clear weather, golden hour sunlight, professional real estate photography",
      negative_prompt: "cloudy, overcast, rain, dark, gloomy, storm",
      strength: 0.4,
      num_inference_steps: 25,
      guidance_scale: 7.5
    },
    webhook: webhookUrl,
    webhook_events_filter: ["completed"]
  })

  store.set(prediction.id, {
    id: prediction.id,
    status: prediction.status,
    input: { image: body.image, prompt: body.prompt }
  })

  return {
    id: prediction.id,
    status: prediction.status
  }
})
