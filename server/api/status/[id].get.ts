import Replicate from 'replicate'
import { store } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Prediction ID is required' })
  }

  // Check local store first
  const cached = store.get(id)
  if (cached?.status === 'succeeded' || cached?.status === 'failed') {
    return cached
  }

  // Poll Replicate for latest status
  const replicate = new Replicate({
    auth: config.replicateApiToken
  })

  const prediction = await replicate.predictions.get(id)

  // Update local store
  store.update(id, {
    status: prediction.status,
    output: prediction.output,
    error: prediction.error
  })

  return {
    id: prediction.id,
    status: prediction.status,
    output: prediction.output,
    error: prediction.error
  }
})
