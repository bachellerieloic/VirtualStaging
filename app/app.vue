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

      <label for="room">Room Type</label>
      <select id="room" v-model="room">
        <option value="Living Room">Living Room</option>
        <option value="Bedroom">Bedroom</option>
        <option value="Dining Room">Dining Room</option>
        <option value="Kitchen">Kitchen</option>
        <option value="Bathroom">Bathroom</option>
        <option value="Office">Office</option>
        <option value="Balcony">Balcony</option>
        <option value="Garden">Garden</option>
        <option value="Swimming Pool">Swimming Pool</option>
      </select>

      <label for="furnitureStyle">Furniture Style</label>
      <select id="furnitureStyle" v-model="furnitureStyle">
        <option value="Modern">Modern</option>
        <option value="Scandinavian">Scandinavian</option>
        <option value="Transitional">Transitional</option>
        <option value="Rustic">Rustic</option>
        <option value="Mid-Century Modern">Mid-Century Modern</option>
        <option value="Urban Industrial">Urban Industrial</option>
        <option value="Farmhouse">Farmhouse</option>
        <option value="Coastal">Coastal</option>
        <option value="Traditional">Traditional</option>
        <option value="Modern Organic">Modern Organic</option>
      </select>

      <label>Furniture Items</label>
      <div class="furniture-controls">
        <button type="button" @click="selectAllFurniture" class="control-btn">Select All</button>
        <button type="button" @click="deselectAllFurniture" class="control-btn">Deselect All</button>
      </div>
      <div class="furniture-items">
        <div v-for="item in availableFurnitureItems" :key="item" class="checkbox-group">
          <input
            :id="`furniture-${item}`"
            type="checkbox"
            :value="item"
            v-model="selectedFurnitureItems"
          />
          <label :for="`furniture-${item}`" class="checkbox-label">{{ item }}</label>
        </div>
      </div>

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

    <div v-if="predictions.length > 0" class="gallery-section">
      <h2>Gallery</h2>
      <div class="gallery-grid">
        <div v-for="pred in predictions" :key="pred.id" class="gallery-item">
          <img :src="pred.imageUrl" :alt="`${pred.room} - ${pred.furnitureStyle}`" />
          <div class="gallery-info">
            <p><strong>{{ pred.room }}</strong></p>
            <p class="style">{{ pred.furnitureStyle }}</p>
            <p class="date">{{ formatDate(pred.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const furnitureByRoom: Record<string, string[]> = {
  'Living Room': ['Sofa', 'Coffee table', 'Armchair', 'TV stand', 'Rug', 'Floor lamp', 'Side table', 'Artwork', 'Plants'],
  'Bedroom': ['Bed', 'Nightstands', 'Dresser', 'Bedside lamps', 'Rug', 'Mirror', 'Wardrobe', 'Plants'],
  'Dining Room': ['Dining table', 'Dining chairs', 'Sideboard', 'Pendant light', 'Wall art', 'Cabinet', 'Plants', 'Chandelier'],
  'Kitchen': ['Island', 'Bar stools', 'Dining table', 'Pendant lights', 'Potted plants', 'Shelving'],
  'Bathroom': ['Vanity', 'Mirror', 'Storage shelves', 'Towel rack', 'Plants', 'Lighting fixtures'],
  'Office': ['Desk', 'Office chair', 'Bookshelf', 'Computer', 'Desk lamp', 'Storage', 'Plants', 'Wall art'],
  'Balcony': ['Outdoor chairs', 'Table', 'Umbrella', 'Plants', 'Lounger', 'Bench', 'Lighting'],
  'Garden': ['Benches', 'Chairs', 'Table', 'Outdoor lighting', 'Plants', 'Decorative items'],
  'Swimming Pool': ['Sun loungers', 'Umbrellas', 'Pool chairs', 'Tables', 'Plants', 'Lighting']
}

const imageUrl = ref('')
const room = ref('Living Room')
const furnitureStyle = ref('Modern')
const selectedFurnitureItems = ref<string[]>([...furnitureByRoom['Living Room']])
const loading = ref(false)
const error = ref('')
const imageError = ref(false)
const predictions = ref<any[]>([])
const currentPrediction = ref<{
  id: string
  status: string
  output?: string | string[]
  error?: string
} | null>(null)

const availableFurnitureItems = computed(() => furnitureByRoom[room.value] || [])

// Update selected items when room changes
watch(room, (newRoom) => {
  selectedFurnitureItems.value = [...furnitureByRoom[newRoom]]
})

const selectAllFurniture = () => {
  selectedFurnitureItems.value = [...availableFurnitureItems.value]
}

const deselectAllFurniture = () => {
  selectedFurnitureItems.value = []
}

const fetchPredictions = async () => {
  try {
    const data = await $fetch('/api/predictions')
    predictions.value = data.predictions || []
  } catch (err) {
    console.error('Failed to fetch predictions:', err)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// Fetch predictions on mount
onMounted(() => {
  fetchPredictions()
})

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
        ...(endpoint === '/api/stage' && {
          room: room.value,
          furnitureStyle: furnitureStyle.value,
          furnitureItems: selectedFurnitureItems.value.length > 0 ? selectedFurnitureItems.value.join(', ') : undefined
        })
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
  // Refresh predictions gallery
  fetchPredictions()
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

input,
select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
}

input:focus,
select:focus {
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

.furniture-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.control-btn {
  flex: 0;
  padding: 8px 12px;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.control-btn:hover {
  background: #e0e0e0;
}

.furniture-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.checkbox-label {
  margin: 0;
  font-weight: 400;
  display: inline;
  cursor: pointer;
}

.gallery-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.gallery-section h2 {
  margin-top: 0;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.gallery-item {
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.gallery-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.gallery-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.gallery-info {
  padding: 10px;
}

.gallery-info p {
  margin: 5px 0;
  font-size: 13px;
}

.gallery-info .style {
  color: #0070f3;
  font-weight: 500;
}

.gallery-info .date {
  color: #999;
  font-size: 11px;
}
</style>
