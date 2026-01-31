import { kv } from '../../utils/kv'

const config = useRuntimeConfig()

const R2_API_URL = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/r2/buckets/realestate/objects`

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Prediction ID is required' })
  }

  try {
    // Get the prediction to find R2 file names
    const prediction = await kv.get(id)

    if (!prediction) {
      throw createError({ statusCode: 404, message: 'Prediction not found' })
    }

    // Delete from R2 (after image)
    const afterFileName = `${id}.png`
    try {
      await fetch(`${R2_API_URL}/${afterFileName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.cloudflareR2ApiToken}`
        }
      })
      console.log(`[Delete] Removed R2 after image: ${afterFileName}`)
    } catch (r2Error) {
      console.error(`[Delete] Failed to delete R2 after image:`, r2Error)
      // Continue anyway - KV deletion is more important
    }

    // Delete from KV
    await kv.delete(id)
    console.log(`[Delete] Removed prediction ${id} from KV`)

    return { success: true, id }
  } catch (error: any) {
    console.error(`[Delete] Error deleting prediction ${id}:`, error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete prediction'
    })
  }
})
