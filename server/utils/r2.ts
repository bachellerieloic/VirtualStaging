const config = useRuntimeConfig()

const R2_PUBLIC_URL = 'https://7c96f73f8ca4f2a353d10829c4f04a95.r2.cloudflarestorage.com/realestate'
const R2_API_URL = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/r2/buckets/realestate/objects`

export const uploadToR2 = async (imageUrl: string, predictionId: string): Promise<string> => {
  try {
    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    const fileName = `${predictionId}.png`

    // Upload to R2 using API token
    const uploadResponse = await fetch(`${R2_API_URL}/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.cloudflareR2ApiToken}`,
        'Content-Type': 'image/png'
      },
      body: buffer
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`R2 upload failed: ${uploadResponse.statusText} - ${errorText}`)
    }

    const r2Url = `${R2_PUBLIC_URL}/${fileName}`
    console.log('[R2] Upload successful:', r2Url)

    return r2Url
  } catch (error) {
    console.error('[R2] Upload error:', error)
    throw error
  }
}

export const getImageUrl = (imageUrl: string | string[]): string => {
  return Array.isArray(imageUrl) ? imageUrl[0] : imageUrl
}
