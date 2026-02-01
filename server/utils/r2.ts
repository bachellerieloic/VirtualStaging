const config = useRuntimeConfig()

const R2_API_URL = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/r2/buckets/realestate/objects`

// Returns a proxy URL that serves images through our API
export const getProxyUrl = (fileName: string): string => {
  return `/api/images/${fileName}`
}

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

    // Return proxy URL instead of direct R2 URL
    const proxyUrl = getProxyUrl(fileName)
    console.log('[R2] Upload successful, proxy URL:', proxyUrl)

    return proxyUrl
  } catch (error) {
    console.error('[R2] Upload error:', error)
    throw error
  }
}

export const getImageUrl = (imageUrl: string | string[]): string => {
  return Array.isArray(imageUrl) ? imageUrl[0] : imageUrl
}
