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

  // Use stability-ai inpainting model for virtual staging
  const prediction = await replicate.predictions.create({
    version: "c11bac58203367db93a3c552bd49a25a5418458ddffb7e90dae55780765e26d6",
    input: {
      image: body.image,
      prompt: body.prompt || "modern minimalist furniture, interior design, real estate photography, professional staging, 8k, photorealistic",
      negative_prompt: "blurry, low quality, distorted, unrealistic",
      num_inference_steps: 25,
      guidance_scale: 7.5
    },
    webhook: webhookUrl,
    webhook_events_filter: ["completed"]
  })

  // Store prediction for tracking
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
