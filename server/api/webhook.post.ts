import { store } from '../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Replicate sends prediction data in webhook
  const { id, status, output, error } = body

  if (!id) {
    throw createError({ statusCode: 400, message: 'Invalid webhook payload' })
  }

  // Update stored prediction
  store.update(id, {
    status,
    output,
    error
  })

  console.log(`[Webhook] Prediction ${id}: ${status}`, output ? '(has output)' : '')

  return { received: true }
})
