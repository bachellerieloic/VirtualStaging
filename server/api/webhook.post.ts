import { store } from '../utils/store'
import { uploadToR2, getImageUrl } from '../utils/r2'
import { kv } from '../utils/kv'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Replicate sends prediction data in webhook
  const { id, status, output, error, input } = body

  if (!id) {
    throw createError({ statusCode: 400, message: 'Invalid webhook payload' })
  }

  // Update in-memory store
  store.update(id, {
    status,
    output,
    error
  })

  // If prediction succeeded, upload to R2 and save metadata to KV
  if (status === 'succeeded' && output) {
    try {
      const replicateUrl = getImageUrl(output)
      let afterUrl = replicateUrl

      // Upload staged result to R2 (afterUrl)
      try {
        afterUrl = await uploadToR2(replicateUrl, id)
        console.log(`[Webhook] After image uploaded to R2: ${afterUrl}`)
      } catch (r2Error) {
        console.error(`[Webhook] R2 upload failed, falling back to Replicate URL:`, r2Error)
        // Fall back to Replicate URL if R2 upload fails
      }

      // Get beforeUrl from in-memory store (set during /api/stage)
      const storedPrediction = store.get(id)
      const beforeUrl = storedPrediction?.input?.beforeUrl || input?.image || ''

      // Store metadata in KV with beforeUrl and afterUrl
      await kv.put(id, {
        id,
        beforeUrl,
        afterUrl,
        // Legacy fields for backward compatibility
        imageUrl: replicateUrl,
        r2Url: afterUrl,
        room: input?.room || 'Unknown',
        furnitureStyle: input?.furniture_style || 'Unknown',
        furnitureItems: input?.furniture_items || '',
        status: 'succeeded',
        createdAt: new Date().toISOString()
      })

      console.log(`[Webhook] Prediction ${id} saved to KV with beforeUrl: ${beforeUrl}`)
    } catch (err) {
      console.error(`[Webhook] Failed to save prediction ${id}:`, err)
    }
  }

  console.log(`[Webhook] Prediction ${id}: ${status}`, output ? '(has output)' : '')

  return { received: true }
})
