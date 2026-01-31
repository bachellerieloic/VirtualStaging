// Simple in-memory store for POC (use Redis/DB in production)
const predictions = new Map<string, {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed'
  input: { image: string; prompt: string }
  output?: string | string[]
  error?: string
  createdAt: Date
}>()

export const store = {
  set(id: string, data: any) {
    predictions.set(id, { ...data, createdAt: new Date() })
  },
  get(id: string) {
    return predictions.get(id)
  },
  update(id: string, data: Partial<any>) {
    const existing = predictions.get(id)
    if (existing) {
      predictions.set(id, { ...existing, ...data })
    }
  },
  getAll() {
    return Array.from(predictions.values())
  }
}
