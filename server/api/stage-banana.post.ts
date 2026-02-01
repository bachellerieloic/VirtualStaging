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

  // Build the virtual staging prompt
  // Core instruction to preserve room structure and add furniture
  const basePrompt = `Transform this empty room into a beautifully staged living space.
IMPORTANT: Keep all architectural elements exactly in place - windows, doors, walls, flooring, ceiling, and any built-in features must remain unchanged in position, size, and style.
Add tasteful, modern furniture and decor that fits naturally in the space. Ensure proper scale and perspective for all furniture pieces.`

  // Concatenate user's extra prompt if provided
  const fullPrompt = body.extraPrompt
    ? `${basePrompt}\n\nAdditional instructions: ${body.extraPrompt}`
    : basePrompt

  // Use Nano Banana Pro model
  const prediction = await replicate.predictions.create({
    model: "google/nano-banana-pro",
    input: {
      prompt: fullPrompt,
      image_input: [body.image],
      resolution: "2K",
      aspect_ratio: "4:3",
      output_format: "png",
      safety_filter_level: "block_only_high"
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
