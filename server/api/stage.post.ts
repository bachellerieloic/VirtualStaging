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

  // Use proplabs virtual staging model with specific version
  const prediction = await replicate.predictions.create({
    version: "635d607efc6e3a6016ef6d655327cd35f3d792e84b8f110688b04498c6e94cfb",
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

  // Store prediction for tracking (include beforeUrl)
  store.set(prediction.id, {
    id: prediction.id,
    status: prediction.status,
    input: { image: body.image, beforeUrl: body.beforeUrl || body.image }
  })

  return {
    id: prediction.id,
    status: prediction.status
  }
})
