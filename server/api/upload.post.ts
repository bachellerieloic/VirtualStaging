const config = useRuntimeConfig()

const R2_PUBLIC_URL = 'https://7c96f73f8ca4f2a353d10829c4f04a95.r2.cloudflarestorage.com/realestate'
const R2_API_URL = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/r2/buckets/realestate/objects`

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const file = formData.find((item) => item.name === 'file')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'No file data found' })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const contentType = file.type || 'image/png'

  if (!allowedTypes.includes(contentType)) {
    throw createError({
      statusCode: 400,
      message: `Invalid file type: ${contentType}. Allowed types: JPEG, PNG, WebP, GIF`
    })
  }

  // Generate unique filename with timestamp
  const timestamp = Date.now()
  const ext = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1]
  const fileName = `before-${timestamp}.${ext}`

  try {
    // Upload to R2
    const uploadResponse = await fetch(`${R2_API_URL}/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.cloudflareR2ApiToken}`,
        'Content-Type': contentType
      },
      body: file.data
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`R2 upload failed: ${uploadResponse.statusText} - ${errorText}`)
    }

    const r2Url = `${R2_PUBLIC_URL}/${fileName}`
    console.log('[Upload] Before image uploaded:', r2Url)

    return {
      url: r2Url,
      fileName
    }
  } catch (error) {
    console.error('[Upload] Error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to upload image'
    })
  }
})
