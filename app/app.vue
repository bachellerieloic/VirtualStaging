<template>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <img src="/oakwyn.png" alt="Oakwyn" class="logo" height="200px" />
          <div class="logo-text">
            <h1>Oakwyn</h1>
            <p>Virtual Staging</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main">
      <div class="container">
        <!-- Form Section -->
        <section class="form-section">
      <label>Image Source</label>
      <div class="input-tabs">
        <button
          type="button"
          :class="['tab-btn', { active: inputMode === 'upload' }]"
          @click="inputMode = 'upload'"
        >
          From Device
        </button>
        <button
          type="button"
          :class="['tab-btn', { active: inputMode === 'url' }]"
          @click="inputMode = 'url'"
        >
          From Link
        </button>
      </div>

      <!-- Upload Tab -->
      <div v-if="inputMode === 'upload'" class="upload-area">
        <div
          class="dropzone"
          :class="{ dragover: isDragging, 'has-file': uploadedFile }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            @change="handleFileSelect"
            hidden
          />
          <div v-if="!uploadedFile && !uploading" class="dropzone-content">
            <span class="dropzone-icon">📁</span>
            <p>Drop image here or click to browse</p>
            <p class="dropzone-hint">JPEG, PNG, WebP, GIF</p>
          </div>
          <div v-else-if="uploading" class="dropzone-content">
            <div class="spinner small"></div>
            <p>Uploading...</p>
          </div>
          <div v-else class="dropzone-preview">
            <img :src="uploadedFileUrl" alt="Preview" />
            <button type="button" class="remove-file" @click.stop="removeUploadedFile">✕</button>
          </div>
        </div>
      </div>

      <!-- URL Tab -->
      <div v-else>
        <input
          id="imageUrl"
          v-model="imageUrl"
          type="url"
          placeholder="https://example.com/room.jpg"
        />
      </div>

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

          <div class="button-group">
            <button @click="submitStaging" :disabled="loading || !hasImage" class="btn btn-primary">
              <span v-if="!loading">✨ Virtual Stage</span>
              <span v-else>Processing...</span>
            </button>
            <button @click="submitSunny" :disabled="loading || !hasImage" class="btn btn-secondary">
              <span v-if="!loading">☀️ Make Sunny</span>
              <span v-else>Processing...</span>
            </button>
          </div>
        </section>

        <!-- Error State -->
        <div v-if="error" class="error-banner">
          <p>{{ error }}</p>
        </div>

        <!-- Results Section -->
        <div v-if="currentPrediction" class="results-section">
          <div class="result-card">
            <div v-if="currentPrediction.status === 'succeeded' && currentPrediction.output" class="result-image">
              <img
                :src="Array.isArray(currentPrediction.output) ? currentPrediction.output[0] : currentPrediction.output"
                alt="Staged result"
              />
              <span class="badge">Complete</span>
            </div>

            <div v-if="currentPrediction.status === 'failed'" class="result-error">
              <p>{{ currentPrediction.error || 'Processing failed' }}</p>
            </div>

            <div v-if="currentPrediction.status !== 'succeeded' && currentPrediction.status !== 'failed'" class="result-loading">
              <div class="spinner"></div>
              <p>{{ currentPrediction.status === 'processing' ? 'Creating your staged room...' : 'Preparing...' }}</p>
            </div>
          </div>

          <div v-if="activeImageUrl" class="preview-card">
            <p class="preview-label">Original</p>
            <img :src="activeImageUrl" alt="Input preview" @error="imageError = true" class="preview-image" />
          </div>
        </div>

        <!-- Gallery Section -->
        <section v-if="predictions.length > 0" class="gallery-section">
          <div class="section-header">
            <h2>Recent Staging</h2>
            <p class="section-subtitle">Your virtual staging history</p>
          </div>
          <div class="gallery-grid">
            <div v-for="pred in predictions" :key="pred.id" class="gallery-card" @click="openGalleryItem(pred)">
              <div class="gallery-image-wrapper">
                <img :src="pred.imageUrl" :alt="`${pred.room} - ${pred.furnitureStyle}`" />
              </div>
              <div class="gallery-card-info">
                <h3>{{ pred.room }}</h3>
                <p class="gallery-style">{{ pred.furnitureStyle }}</p>
                <p class="gallery-date">{{ formatDate(pred.createdAt) }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Gallery Modal -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="selectedGalleryItem" class="modal-overlay" @click="closeGalleryItem">
          <div class="modal-content" @click.stop>
            <button class="modal-close" @click="closeGalleryItem">✕</button>

            <!-- Before/After Slider -->
            <div class="modal-image comparison-container" ref="comparisonRef">
              <img :src="selectedGalleryItem.afterUrl || selectedGalleryItem.r2Url" class="comparison-after" :alt="`${selectedGalleryItem.room} - After`" />
              <div
                class="comparison-before"
                :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }"
              >
                <img :src="selectedGalleryItem.beforeUrl || selectedGalleryItem.afterUrl || selectedGalleryItem.r2Url" :alt="`${selectedGalleryItem.room} - Before`" />
              </div>
              <div
                class="comparison-slider"
                :style="{ left: `${sliderPosition}%` }"
                @mousedown="startDrag"
                @touchstart="startDrag"
              >
                <div class="slider-handle">
                  <span class="slider-arrow left">◀</span>
                  <span class="slider-arrow right">▶</span>
                </div>
              </div>
              <div class="comparison-labels">
                <span class="label-before">Before</span>
                <span class="label-after">After</span>
              </div>
            </div>

            <div class="modal-footer">
              <div class="modal-info">
                <h2>{{ selectedGalleryItem.room }}</h2>
                <p class="modal-style">{{ selectedGalleryItem.furnitureStyle }}</p>
                <p class="modal-items">{{ selectedGalleryItem.furnitureItems }}</p>
                <p class="modal-date">{{ formatDate(selectedGalleryItem.createdAt) }}</p>
              </div>
              <button class="modal-download" @click="downloadImage">
                <span>⬇</span> Download
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
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

// Input mode: 'upload' or 'url'
const inputMode = ref<'upload' | 'url'>('upload')
const imageUrl = ref('')

// File upload state
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const uploadedFileUrl = ref('')
const uploading = ref(false)
const isDragging = ref(false)

// Before/After slider state
const sliderPosition = ref(50)
const comparisonRef = ref<HTMLElement | null>(null)
const isDraggingSlider = ref(false)

const room = ref('Living Room')
const furnitureStyle = ref('Modern')
const selectedFurnitureItems = ref<string[]>([...furnitureByRoom['Living Room']])
const loading = ref(false)
const error = ref('')
const imageError = ref(false)
const predictions = ref<any[]>([])
const selectedGalleryItem = ref<any>(null)
const currentPrediction = ref<{
  id: string
  status: string
  output?: string | string[]
  error?: string
} | null>(null)

// Computed: check if we have an image (either uploaded or URL)
const hasImage = computed(() => {
  if (inputMode.value === 'upload') {
    return !!uploadedFileUrl.value
  }
  return !!imageUrl.value
})

// Get the active image URL based on input mode
const activeImageUrl = computed(() => {
  if (inputMode.value === 'upload') {
    return uploadedFileUrl.value
  }
  return imageUrl.value
})

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

// File upload handlers
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadFile(file)
  }
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    await uploadFile(file)
  }
}

const uploadFile = async (file: File) => {
  uploadedFile.value = file
  uploading.value = true
  error.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch<{ url: string; fileName: string }>('/api/upload', {
      method: 'POST',
      body: formData
    })

    uploadedFileUrl.value = response.url
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to upload image'
    uploadedFile.value = null
    uploadedFileUrl.value = ''
  } finally {
    uploading.value = false
  }
}

const removeUploadedFile = () => {
  uploadedFile.value = null
  uploadedFileUrl.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Before/After slider handlers
const startDrag = (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  isDraggingSlider.value = true

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingSlider.value || !comparisonRef.value) return

    const rect = comparisonRef.value.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    sliderPosition.value = percentage
  }

  const handleEnd = () => {
    isDraggingSlider.value = false
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleEnd)
    document.removeEventListener('touchmove', handleMove)
    document.removeEventListener('touchend', handleEnd)
  }

  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', handleMove)
  document.addEventListener('touchend', handleEnd)
}

// Reset slider when opening a new gallery item
watch(selectedGalleryItem, () => {
  sliderPosition.value = 50
})

// Clear other input when switching tabs
watch(inputMode, (newMode) => {
  if (newMode === 'upload') {
    imageUrl.value = ''
  } else {
    removeUploadedFile()
  }
})

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

const openGalleryItem = (item: any) => {
  selectedGalleryItem.value = item
}

const closeGalleryItem = () => {
  selectedGalleryItem.value = null
}

const downloadImage = async () => {
  if (!selectedGalleryItem.value) return

  try {
    // Download the "after" (staged) image
    const afterUrl = selectedGalleryItem.value.afterUrl || selectedGalleryItem.value.r2Url
    const response = await fetch(afterUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedGalleryItem.value.room}-${selectedGalleryItem.value.furnitureStyle}-${selectedGalleryItem.value.id}.png`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Download failed:', err)
  }
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

  const imageToProcess = activeImageUrl.value

  try {
    const response = await $fetch(endpoint, {
      method: 'POST',
      body: {
        image: imageToProcess,
        beforeUrl: imageToProcess, // Store the original image as "before"
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

html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  background: #ffffff;
  color: #1d1d1d;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: saturate(180%) blur(20px);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  width: 120px;
  height: auto;
}

.logo-text h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.4px;
  color: #1d1d1d;
  line-height: 1.2;
}

.logo-text p {
  margin: 0;
  margin-top: 2px;
  font-size: 13px;
  color: #a3a3a3;
  font-weight: 400;
  letter-spacing: 0.2px;
}

/* Main Content */
.main {
  flex: 1;
  padding: 64px 24px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

/* Form Section */
.form-section {
  background: white;
  padding: 48px;
  border-radius: 24px;
  margin-bottom: 80px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #1d1d1d;
  font-size: 14px;
  letter-spacing: 0.2px;
}

input,
select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  margin-bottom: 24px;
  font-size: 15px;
  font-family: inherit;
  background: #f9f9f9;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #1d1d1d;
}

input::placeholder {
  color: #c8c8c8;
}

input:focus,
select:focus {
  outline: none;
  border-color: #b8a454;
  background: white;
  box-shadow: 0 0 0 3px rgba(162, 159, 127, 0.1);
}

/* Button Group */
.button-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 40px;
}

.btn {
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  letter-spacing: 0.3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: #b8a454;
  color: white;
  box-shadow: 0 2px 8px rgba(162, 159, 127, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: #a59443;
  box-shadow: 0 6px 20px rgba(162, 159, 127, 0.35);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(162, 159, 127, 0.2);
}

.btn-primary:disabled {
  background: #e8e8e8;
  box-shadow: none;
  cursor: not-allowed;
  color: #b5b5b5;
}

.btn-secondary {
  background: #f5f5f5;
  color: #1d1d1d;
  border: 1px solid #e8e8e8;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.btn-secondary:hover:not(:disabled) {
  background: white;
  border-color: #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.btn-secondary:active:not(:disabled) {
  background: #f9f9f9;
}

.btn-secondary:disabled {
  background: #fafafa;
  border-color: #f0f0f0;
  cursor: not-allowed;
  color: #d0d0d0;
}

/* Error Banner */
.error-banner {
  background: #fff3cd;
  border: 1px solid #ffecb5;
  color: #856404;
  padding: 16px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
}

/* Results Section */
.results-section {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  margin-bottom: 60px;
}

.result-card,
.preview-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.result-image {
  position: relative;
  width: 100%;
}

.result-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
  display: block;
}

.badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #34c759;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.result-loading {
  padding: 60px 40px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #b8a454;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-error {
  padding: 40px;
  color: #d32f2f;
  text-align: center;
}

.preview-label {
  padding: 16px 20px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
}

.preview-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
}

/* Input Tabs */
.input-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  background: #f9f9f9;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s;
  color: #666;
}

.tab-btn:hover {
  background: #f0f0f0;
  border-color: #d8d8d8;
}

.tab-btn.active {
  background: #b8a454;
  color: white;
  border-color: #b8a454;
}

/* Upload Area / Dropzone */
.upload-area {
  margin-bottom: 24px;
}

.dropzone {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s;
  background: #fafafa;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropzone:hover {
  border-color: #b8a454;
  background: #f9f9f7;
}

.dropzone.dragover {
  border-color: #b8a454;
  background: rgba(162, 159, 127, 0.05);
  border-style: solid;
}

.dropzone.has-file {
  padding: 0;
  border-style: solid;
  border-color: #e0e0e0;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dropzone-icon {
  font-size: 36px;
  opacity: 0.7;
}

.dropzone-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.dropzone-hint {
  color: #999 !important;
  font-size: 12px !important;
}

.dropzone-preview {
  position: relative;
  width: 100%;
  height: 200px;
}

.dropzone-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.remove-file {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.remove-file:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.spinner.small {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

/* Before/After Comparison Slider */
.comparison-container {
  position: relative;
  overflow: hidden;
  user-select: none;
}

.comparison-after {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.comparison-before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.comparison-before img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.comparison-slider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  background: white;
  cursor: ew-resize;
  transform: translateX(-50%);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

.slider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  gap: 2px;
}

.slider-arrow {
  font-size: 10px;
  color: #666;
}

.slider-arrow.left {
  margin-right: 2px;
}

.slider-arrow.right {
  margin-left: 2px;
}

.comparison-labels {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.comparison-labels span {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

/* Furniture Controls */
.furniture-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.control-btn {
  padding: 8px 14px;
  background: white;
  color: #1d1d1d;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s;
}

.control-btn:hover {
  background: #f5f5f5;
  border-color: #d8d8d8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.control-btn:active {
  background: #efefef;
}

/* Furniture Items */
.furniture-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 28px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #b8a454;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-group input[type="checkbox"]:hover {
  box-shadow: 0 0 0 2px rgba(162, 159, 127, 0.1);
}

.checkbox-label {
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  color: #1d1d1d;
  font-weight: 400;
}

/* Gallery Section */
.gallery-section {
  margin-top: 100px;
}

.section-header {
  margin-bottom: 40px;
}

.section-header h2 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: #1d1d1d;
  line-height: 1.2;
}

.section-subtitle {
  margin: 0;
  font-size: 16px;
  color: #999;
  font-weight: 400;
  letter-spacing: 0.2px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.gallery-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.gallery-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: rgba(162, 159, 127, 0.15);
}

.gallery-image-wrapper {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: #f5f5f5;
}

.gallery-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.gallery-card:hover .gallery-image-wrapper img {
  transform: scale(1.05);
}

.gallery-card-info {
  padding: 16px 16px;
}

.gallery-card-info h3 {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1d;
  line-height: 1.3;
}

.gallery-style {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #b8a454;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.gallery-date {
  margin: 0;
  font-size: 12px;
  color: #b0b0b0;
  letter-spacing: 0.1px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.25s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.modal-close:hover {
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: scale(1.05);
}

.modal-close:active {
  transform: scale(0.95);
}

.modal-image {
  position: relative;
  width: 100%;
  flex: 1;
  overflow: hidden;
  background: #f5f5f5;
}

.modal-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.modal-footer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  padding: 36px;
  border-top: 1px solid #f0f0f0;
  align-items: center;
}

.modal-info h2 {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1d;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.modal-style {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #b8a454;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.modal-items {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #888;
  letter-spacing: 0.2px;
}

.modal-date {
  margin: 0;
  font-size: 12px;
  color: #b0b0b0;
  letter-spacing: 0.1px;
}

.modal-download {
  background: #b8a454;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(162, 159, 127, 0.2);
}

.modal-download:hover {
  background: #a59443;
  box-shadow: 0 6px 18px rgba(162, 159, 127, 0.35);
  transform: translateY(-1px);
}

.modal-download:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(162, 159, 127, 0.2);
}

.modal-download span {
  font-size: 18px;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .form-section {
    padding: 24px;
  }

  .button-group {
    grid-template-columns: 1fr;
  }

  .results-section {
    grid-template-columns: 1fr;
  }

  .result-image img {
    height: 300px;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }

  .logo-text h1 {
    font-size: 24px;
  }

  .section-header h2 {
    font-size: 24px;
  }

  .modal-content {
    max-height: 95vh;
    max-width: 95%;
  }

  .modal-footer {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .modal-download {
    width: 100%;
    justify-content: center;
  }

  .modal-info h2 {
    font-size: 20px;
  }

  .results-section {
    grid-template-columns: 1fr;
  }

  .form-section {
    padding: 24px;
  }

  .button-group {
    grid-template-columns: 1fr;
  }
}
</style>
