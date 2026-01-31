export interface PredictionMetadata {
  id: string
  imageUrl: string
  r2Url: string
  room: string
  furnitureStyle: string
  furnitureItems: string
  status: 'processing' | 'succeeded' | 'failed'
  error?: string
  createdAt: string
}

const config = useRuntimeConfig()

const KV_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/storage/kv/namespaces/${config.cloudflareKvNamespaceId}`

export const kv = {
  async put(key: string, value: PredictionMetadata) {
    const response = await fetch(`${KV_API_BASE}/values/${key}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.cloudflareKvApiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(value)
    })

    if (!response.ok) {
      throw new Error(`KV put failed: ${response.statusText}`)
    }
  },

  async get(key: string): Promise<PredictionMetadata | null> {
    const response = await fetch(`${KV_API_BASE}/values/${key}`, {
      headers: {
        'Authorization': `Bearer ${config.cloudflareKvApiToken}`
      }
    })

    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`KV get failed: ${response.statusText}`)
    }

    return await response.json()
  },

  async list(): Promise<PredictionMetadata[]> {
    const response = await fetch(`${KV_API_BASE}/keys`, {
      headers: {
        'Authorization': `Bearer ${config.cloudflareKvApiToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`KV list failed: ${response.statusText}`)
    }

    const data = await response.json() as { result: { name: string }[] }
    const keys = data.result.map(k => k.name)

    // Fetch all values
    const predictions: PredictionMetadata[] = []
    for (const key of keys) {
      const value = await this.get(key)
      if (value) predictions.push(value)
    }

    return predictions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  async delete(key: string) {
    const response = await fetch(`${KV_API_BASE}/values/${key}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.cloudflareKvApiToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`KV delete failed: ${response.statusText}`)
    }
  }
}
