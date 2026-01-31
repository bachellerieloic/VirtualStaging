import { kv } from '../utils/kv'

export default defineEventHandler(async () => {
  try {
    const predictions = await kv.list()
    return {
      predictions,
      total: predictions.length
    }
  } catch (error) {
    console.error('[API] Failed to fetch predictions:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch predictions'
    })
  }
})
