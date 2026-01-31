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

  // Use proplabs virtual staging model
  const prediction = await replicate.predictions.create({
    model: "proplabs/virtual-staging",
    input: {
      image: body.image,
      room: body.room || "Living Room",
      furniture_style: body.furnitureStyle || "Modern",
      furniture_items: body.furnitureItems || "sofa, coffee table, rug, accent chairs, lamps, plants",
      replicate_api_key: config.replicateApiToken
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
