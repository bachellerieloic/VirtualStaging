const config = useRuntimeConfig()

const R2_API_URL = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/r2/buckets/realestate/objects`

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')

  if (!path) {
    throw createError({ statusCode: 400, message: 'Path is required' })
  }

  try {
    // Fetch from R2
    const response = await fetch(`${R2_API_URL}/${path}`, {
      headers: {
        'Authorization': `Bearer ${config.cloudflareR2ApiToken}`
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `Image not found: ${response.statusText}`
      })
    }

    // Get content type from response or default to image
    const contentType = response.headers.get('content-type') || 'image/png'

    // Stream the image back
    const buffer = await response.arrayBuffer()

    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000') // Cache for 1 year

    return new Uint8Array(buffer)
  } catch (error: any) {
    console.error('[Images] Proxy error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch image'
    })
  }
})
