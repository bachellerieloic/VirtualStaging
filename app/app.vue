<template>
  <div class="container">
    <h1>Virtual Staging POC</h1>
    <p class="subtitle">Upload an image URL to test virtual staging or sky replacement</p>

    <div class="form-section">
      <label for="imageUrl">Image URL</label>
      <input
        id="imageUrl"
        v-model="imageUrl"
        type="url"
        placeholder="https://example.com/room.jpg"
      />

      <label for="prompt">Custom Prompt (optional)</label>
      <input
        id="prompt"
        v-model="prompt"
        type="text"
        placeholder="modern minimalist furniture..."
      />

      <div class="buttons">
        <button @click="submitStaging" :disabled="loading || !imageUrl">
          {{ loading ? 'Processing...' : 'Virtual Stage' }}
        </button>
        <button @click="submitSunny" :disabled="loading || !imageUrl" class="secondary">
          {{ loading ? 'Processing...' : 'Make Sunny' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="currentPrediction" class="status-section">
      <h2>Status</h2>
      <p><strong>ID:</strong> {{ currentPrediction.id }}</p>
      <p><strong>Status:</strong> {{ currentPrediction.status }}</p>

      <div v-if="currentPrediction.status === 'succeeded' && currentPrediction.output" class="result">
        <h3>Result</h3>
        <img
          :src="Array.isArray(currentPrediction.output) ? currentPrediction.output[0] : currentPrediction.output"
          alt="Staged result"
        />
      </div>

      <div v-if="currentPrediction.status === 'failed'" class="error">
        {{ currentPrediction.error || 'Processing failed' }}
      </div>
    </div>

    <div v-if="imageUrl" class="preview">
      <h3>Input Preview</h3>
      <img :src="imageUrl" alt="Input preview" @error="imageError = true" />
      <p v-if="imageError" class="error">Could not load image preview</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const imageUrl = ref('')
const prompt = ref('')
const loading = ref(false)
const error = ref('')
const imageError = ref(false)
const currentPrediction = ref<{
  id: string
  status: string
  output?: string | string[]
  error?: string
} | null>(null)

let pollInterval: ReturnType<typeof setInterval> | null = null

const submitStaging = async () => {
  await submit('/api/stage')
}

const submitSunny = async () => {
  await submit('/api/sunny')
}

const submit = async (endpoint: string) => {
  error.value = ''
  loading.value = true
  currentPrediction.value = null

  try {
    const response = await $fetch(endpoint, {
      method: 'POST',
      body: {
        image: imageUrl.value,
        prompt: prompt.value || undefined
      }
    })

    currentPrediction.value = response as any
    startPolling(response.id)
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Something went wrong'
    loading.value = false
  }
}

const startPolling = (id: string) => {
  if (pollInterval) clearInterval(pollInterval)

  pollInterval = setInterval(async () => {
    try {
      const status = await $fetch(`/api/status/${id}`)
      currentPrediction.value = status as any

      if (status.status === 'succeeded' || status.status === 'failed') {
        stopPolling()
        loading.value = false
      }
    } catch (e) {
      console.error('Polling error:', e)
    }
  }, 2000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onUnmounted(() => {
  stopPolling()
})
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  margin: 0;
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  margin-top: 0;
}

.form-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #0070f3;
}

.buttons {
  display: flex;
  gap: 10px;
}

button {
  flex: 1;
  padding: 12px 20px;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #0051cc;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button.secondary {
  background: #10b981;
}

button.secondary:hover:not(:disabled) {
  background: #059669;
}

.error {
  background: #fee;
  color: #c00;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.status-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-section h2 {
  margin-top: 0;
}

.result img {
  max-width: 100%;
  border-radius: 4px;
}

.preview {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.preview h3 {
  margin-top: 0;
}

.preview img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 4px;
}
</style>
