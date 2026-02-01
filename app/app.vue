<template>
  <div class="app">
    <!-- Main Content -->
    <main class="main">
      <div class="container">
        <!-- Form Section -->
        <section class="form-section">
          <div class="form-logo">
            <img src="/oakwyn.png" alt="Oakwyn" />
            <p>Virtual Staging</p>
          </div>
      <label>Staging Model</label>
      <div class="model-toggle">
        <button
          type="button"
          :class="['model-btn', { active: stagingModel === 'proplabs' }]"
          @click="stagingModel = 'proplabs'"
        >
          PropLabs
        </button>
        <button
          type="button"
          :class="['model-btn', { active: stagingModel === 'banana' }]"
          @click="stagingModel = 'banana'"
        >
          Nano Banana Pro
        </button>
      </div>

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
            <img :src="uploadedFilePreview" alt="Preview" />
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

      <!-- PropLabs controls -->
      <template v-if="stagingModel === 'proplabs'">
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
      </template>

      <!-- Nano Banana Pro controls -->
      <template v-else>
        <div class="model-info">
          <p>Nano Banana Pro uses AI to intelligently furnish your space while preserving architectural elements like windows, doors, and flooring.</p>
        </div>

        <label for="extraPrompt">Custom Instructions (Optional)</label>
        <textarea
          id="extraPrompt"
          v-model="extraPrompt"
          placeholder="e.g., Add a modern minimalist living room with a gray sectional sofa, warm lighting, and plants..."
          rows="3"
        ></textarea>
      </template>

          <div class="button-container">
            <button @click="submitStaging" :disabled="loading || !hasImage" class="btn btn-primary">
              <span v-if="!loading">✨ Virtual Stage</span>
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
          <!-- Loading State -->
          <div v-if="currentPrediction.status !== 'succeeded' && currentPrediction.status !== 'failed'" class="result-card result-loading-card">
            <div class="result-loading">
              <div class="spinner"></div>
              <p>{{ loadingMessage }}</p>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="currentPrediction.status === 'failed'" class="result-card result-error-card">
            <div class="result-error">
              <p>{{ currentPrediction.error || 'Processing failed' }}</p>
            </div>
          </div>

          <!-- Success: Before/After Slider -->
          <div v-else-if="currentPrediction.status === 'succeeded' && currentPrediction.output" class="result-slider-card" ref="resultComparisonRef">
            <div class="result-comparison">
              <img
                :src="Array.isArray(currentPrediction.output) ? currentPrediction.output[0] : currentPrediction.output"
                class="result-after"
                alt="Staged result"
              />
              <div
                class="result-before"
                :style="{ clipPath: `inset(0 ${100 - resultSliderPosition}% 0 0)` }"
              >
                <img :src="currentBeforeImage" alt="Original" />
              </div>
              <div
                class="result-slider"
                :style="{ left: `${resultSliderPosition}%` }"
                @mousedown="startResultDrag"
                @touchstart="startResultDrag"
              >
                <div class="slider-handle">
                  <span class="slider-arrow left">◀</span>
                  <span class="slider-arrow right">▶</span>
                </div>
              </div>
              <div class="result-labels">
                <span class="label-before">Before</span>
                <span class="label-after">After</span>
              </div>
            </div>
            <div class="result-actions">
              <button class="result-action-btn delete" @click="deleteCurrentResult" title="Delete">
                🗑
              </button>
              <button class="result-action-btn download" @click="downloadCurrentResult" title="Download">
                ⬇
              </button>
            </div>
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
              <div class="modal-actions">
                <button class="modal-delete" @click="confirmDelete" :disabled="deleting">
                  <span v-if="!deleting">🗑</span>
                  <span v-else class="spinner tiny"></span>
                </button>
                <button class="modal-download" @click="downloadImage">
                  <span>⬇</span> Download
                </button>
              </div>
            </div>

            <!-- Delete Confirmation -->
            <div v-if="showDeleteConfirm" class="delete-confirm-overlay" @click="showDeleteConfirm = false">
              <div class="delete-confirm" @click.stop>
                <p>Delete this staging?</p>
                <p class="delete-hint">This cannot be undone.</p>
                <div class="delete-actions">
                  <button class="btn-cancel" @click="showDeleteConfirm = false">Cancel</button>
                  <button class="btn-delete" @click="deleteStaging" :disabled="deleting">
                    {{ deleting ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </div>
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

// Staging model: 'proplabs' or 'banana'
const stagingModel = ref<'proplabs' | 'banana'>('proplabs')

// Input mode: 'upload' or 'url'
const inputMode = ref<'upload' | 'url'>('upload')
const imageUrl = ref('')

// Nano Banana Pro extra prompt
const extraPrompt = ref('')

// File upload state
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const uploadedFileUrl = ref('')  // R2 URL for storage
const uploadedFileBase64 = ref('')  // Base64 data URI for Replicate
const uploadedFilePreview = ref('')  // Local blob URL for preview
const uploading = ref(false)
const isDragging = ref(false)

// Before/After slider state (modal)
const sliderPosition = ref(50)
const comparisonRef = ref<HTMLElement | null>(null)
const isDraggingSlider = ref(false)

// Result slider state
const resultSliderPosition = ref(50)
const resultComparisonRef = ref<HTMLElement | null>(null)
const isDraggingResultSlider = ref(false)
const currentBeforeImage = ref('')  // Store before image when submitting

// Delete state
const showDeleteConfirm = ref(false)
const deleting = ref(false)

// Loading messages
const loadingMessages = [
  'Analyzing room dimensions...',
  'Detecting natural light sources...',
  'Calculating optimal furniture placement...',
  'Selecting premium furniture pieces...',
  'Matching your chosen style...',
  'Adjusting shadows and reflections...',
  'Rendering high-resolution textures...',
  'Fine-tuning perspective angles...',
  'Applying designer touches...',
  'Polishing final details...',
  'Almost there...'
]
const currentMessageIndex = ref(0)
let messageInterval: ReturnType<typeof setInterval> | null = null

const loadingMessage = computed(() => {
  if (!currentPrediction.value) return 'Preparing...'
  if (currentPrediction.value.status !== 'processing') return 'Preparing...'
  return loadingMessages[currentMessageIndex.value]
})

const startLoadingMessages = () => {
  currentMessageIndex.value = 0
  messageInterval = setInterval(() => {
    currentMessageIndex.value = (currentMessageIndex.value + 1) % loadingMessages.length
  }, 3000)
}

const stopLoadingMessages = () => {
  if (messageInterval) {
    clearInterval(messageInterval)
    messageInterval = null
  }
}

const room = ref('Living Room')
const furnitureStyle = ref('Modern')
const selectedFurnitureItems = ref<string[]>([...(furnitureByRoom['Living Room'] || [])])
const loading = ref(false)
const error = ref('')
const predictions = ref<any[]>([])
const selectedGalleryItem = ref<any>(null)
const currentPrediction = ref<{
  id: string
  status: string
  output?: string | string[]
  error?: string
} | null>(null)

// Computed: check if we have an image ready (either uploaded or URL)
const hasImage = computed(() => {
  if (inputMode.value === 'upload') {
    // Need the base64 to be ready for processing
    return !!uploadedFileBase64.value && !uploading.value
  }
  return !!imageUrl.value
})

// Get the image URL for processing (base64 for uploads, URL for links)
const activeImageUrl = computed(() => {
  if (inputMode.value === 'upload') {
    return uploadedFileBase64.value
  }
  return imageUrl.value
})

// Get the image URL for display (local blob for uploads)
const displayImageUrl = computed(() => {
  if (inputMode.value === 'upload') {
    return uploadedFilePreview.value
  }
  return imageUrl.value
})

const availableFurnitureItems = computed(() => furnitureByRoom[room.value] || [])

// Update selected items when room changes
watch(room, (newRoom) => {
  selectedFurnitureItems.value = [...(furnitureByRoom[newRoom] || [])]
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

  // Create local preview immediately
  uploadedFilePreview.value = URL.createObjectURL(file)

  // Read file as base64 for Replicate
  const reader = new FileReader()
  reader.onload = () => {
    uploadedFileBase64.value = reader.result as string
  }
  reader.readAsDataURL(file)

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
    uploadedFileBase64.value = ''
    // Revoke preview on error
    if (uploadedFilePreview.value) {
      URL.revokeObjectURL(uploadedFilePreview.value)
      uploadedFilePreview.value = ''
    }
  } finally {
    uploading.value = false
  }
}

const removeUploadedFile = () => {
  if (uploadedFilePreview.value) {
    URL.revokeObjectURL(uploadedFilePreview.value)
  }
  uploadedFile.value = null
  uploadedFileUrl.value = ''
  uploadedFileBase64.value = ''
  uploadedFilePreview.value = ''
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
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
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

// Result slider handlers
const startResultDrag = (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  isDraggingResultSlider.value = true

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingResultSlider.value || !resultComparisonRef.value) return

    const container = resultComparisonRef.value.querySelector('.result-comparison')
    if (!container) return

    const rect = container.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    resultSliderPosition.value = percentage
  }

  const handleEnd = () => {
    isDraggingResultSlider.value = false
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

// Reset result slider when new prediction starts
watch(currentPrediction, (newVal, oldVal) => {
  if (newVal && (!oldVal || newVal.id !== oldVal.id)) {
    resultSliderPosition.value = 50
  }
})

const downloadCurrentResult = async () => {
  if (!currentPrediction.value?.output) return

  try {
    const output = currentPrediction.value.output
    if (!output) return
    const imageUrl = Array.isArray(output) ? output[0] : output
    if (!imageUrl) return
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `staged-${currentPrediction.value.id}.png`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Download failed:', err)
  }
}

const deleteCurrentResult = () => {
  currentPrediction.value = null
  currentBeforeImage.value = ''
}

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
  showDeleteConfirm.value = false
}

const confirmDelete = () => {
  showDeleteConfirm.value = true
}

const deleteStaging = async () => {
  if (!selectedGalleryItem.value || deleting.value) return

  deleting.value = true

  try {
    await $fetch(`/api/predictions/${selectedGalleryItem.value.id}`, {
      method: 'DELETE'
    })

    // Remove from local list
    predictions.value = predictions.value.filter(p => p.id !== selectedGalleryItem.value.id)

    // Close modal
    closeGalleryItem()
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to delete'
  } finally {
    deleting.value = false
  }
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
  const endpoint = stagingModel.value === 'banana' ? '/api/stage-banana' : '/api/stage'
  await submit(endpoint)
}

const submit = async (endpoint: string) => {
  error.value = ''
  loading.value = true
  currentPrediction.value = null

  // For Replicate: use base64 for uploads, URL for links
  const imageToProcess = activeImageUrl.value
  // For storage: use R2 URL for uploads, same URL for links
  const beforeUrl = inputMode.value === 'upload' ? uploadedFileUrl.value : imageUrl.value

  // Store the display URL for the result slider (blob for uploads, URL for links)
  currentBeforeImage.value = displayImageUrl.value

  try {
    // Build request body based on endpoint
    let requestBody: Record<string, any> = {
      image: imageToProcess,
      beforeUrl // Store the original image URL for display
    }

    if (endpoint === '/api/stage') {
      // PropLabs model parameters
      requestBody = {
        ...requestBody,
        room: room.value,
        furnitureStyle: furnitureStyle.value,
        furnitureItems: selectedFurnitureItems.value.length > 0 ? selectedFurnitureItems.value.join(', ') : undefined
      }
    } else if (endpoint === '/api/stage-banana') {
      // Nano Banana Pro parameters
      requestBody = {
        ...requestBody,
        extraPrompt: extraPrompt.value || undefined
      }
    }

    const response = await $fetch(endpoint, {
      method: 'POST',
      body: requestBody
    })

    const result = response as { id: string; status: string }
    currentPrediction.value = result
    startPolling(result.id)
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Something went wrong'
    loading.value = false
  }
}

const startPolling = (id: string) => {
  if (pollInterval) clearInterval(pollInterval)

  // Start cycling through fun loading messages
  startLoadingMessages()

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
  // Stop loading messages
  stopLoadingMessages()
  // Refresh predictions gallery
  fetchPredictions()
}

onUnmounted(() => {
  stopPolling()
  stopLoadingMessages()
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

.form-logo {
  text-align: center;
  margin-bottom: 32px;
}

.form-logo img {
  width: 160px;
  height: auto;
}

.form-logo p {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #888;
  font-weight: 500;
  letter-spacing: 0.5px;
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

.btn {
  padding: 14px 32px;
  border: none;
  border-radius: 50px;
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

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
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
  margin-bottom: 60px;
}

.result-card,
.result-slider-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.result-loading-card,
.result-error-card {
  padding: 60px 40px;
  text-align: center;
}

.result-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.result-loading p {
  margin: 0;
  color: #666;
  font-size: 15px;
}

/* Result Slider */
.result-slider-card {
  position: relative;
}

.result-comparison {
  position: relative;
  width: 100%;
  min-height: 350px;
  max-height: 500px;
  overflow: hidden;
  user-select: none;
}

.result-after {
  width: 100%;
  height: 100%;
  max-height: 500px;
  object-fit: contain;
  display: block;
  background: #f5f5f5;
}

.result-before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.result-before img {
  width: 100%;
  height: 100%;
  max-height: 500px;
  object-fit: contain;
}

.result-slider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  background: white;
  cursor: ew-resize;
  transform: translateX(-50%);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

.result-labels {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.result-labels span {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.result-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
}

.result-action-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.25s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.result-action-btn.download {
  background: #b8a454;
  color: white;
}

.result-action-btn.download:hover {
  background: #a59443;
  transform: scale(1.1);
}

.result-action-btn.delete {
  background: white;
}

.result-action-btn.delete:hover {
  background: #fee2e2;
  transform: scale(1.1);
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

/* Model Toggle */
.model-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.model-btn {
  flex: 1;
  padding: 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  background: #f9f9f9;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  color: #666;
}

.model-btn:hover {
  background: #f0f0f0;
  border-color: #d8d8d8;
}

.model-btn.active {
  background: linear-gradient(135deg, #b8a454 0%, #a59443 100%);
  color: white;
  border-color: #b8a454;
  box-shadow: 0 2px 8px rgba(162, 159, 127, 0.25);
}

/* Model Info */
.model-info {
  background: linear-gradient(135deg, #f8f7f3 0%, #f5f4f0 100%);
  border: 1px solid rgba(162, 159, 127, 0.2);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.model-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

/* Textarea */
textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  margin-bottom: 24px;
  font-size: 15px;
  font-family: inherit;
  background: #f9f9f9;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #1d1d1d;
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

textarea::placeholder {
  color: #b0b0b0;
}

textarea:focus {
  outline: none;
  border-color: #b8a454;
  background: white;
  box-shadow: 0 0 0 3px rgba(162, 159, 127, 0.1);
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
  padding: 8px;
  border-style: solid;
  border-color: #e0e0e0;
  min-height: auto;
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
  min-height: 300px;
  max-height: 400px;
}

.dropzone-preview img {
  width: 100%;
  height: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 10px;
  background: #f5f5f5;
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
  min-height: 300px;
  max-height: 60vh;
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

.modal-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.modal-delete {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.25s;
}

.modal-delete:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
}

.modal-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner.tiny {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

/* Delete Confirmation */
.delete-confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  z-index: 20;
}

.delete-confirm {
  background: white;
  padding: 24px 32px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.delete-confirm p {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1d;
}

.delete-hint {
  font-size: 13px !important;
  font-weight: 400 !important;
  color: #888 !important;
  margin-bottom: 20px !important;
}

.delete-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel {
  padding: 10px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

.btn-delete {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #ef4444;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  .model-toggle {
    gap: 6px;
  }

  .model-btn {
    padding: 12px 12px;
    font-size: 13px;
  }

  .model-info {
    padding: 14px 16px;
  }

  .model-info p {
    font-size: 13px;
  }

  textarea {
    font-size: 14px;
    min-height: 70px;
  }

  .main {
    padding: 24px 16px;
  }

  .container {
    max-width: 100%;
  }

  .form-section {
    padding: 20px;
    border-radius: 16px;
    margin-bottom: 40px;
  }

  .form-logo img {
    width: 120px;
  }

  .form-logo p {
    font-size: 12px;
  }

  .input-tabs {
    gap: 6px;
  }

  .tab-btn {
    padding: 10px 12px;
    font-size: 13px;
  }

  .dropzone {
    padding: 24px;
    min-height: 120px;
  }

  .dropzone-preview {
    min-height: 200px;
    max-height: 300px;
  }

  .dropzone-preview img {
    max-height: 300px;
  }

  .furniture-items {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    padding: 12px;
    gap: 8px;
  }

  .checkbox-label {
    font-size: 13px;
  }

  .button-container {
    margin-top: 24px;
  }

  .results-section {
    margin-bottom: 40px;
  }

  .result-comparison {
    min-height: 250px;
    max-height: 350px;
  }

  .result-after,
  .result-before img {
    max-height: 350px;
  }

  .result-actions {
    top: 12px;
    right: 12px;
    gap: 6px;
  }

  .result-action-btn {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .result-labels span {
    padding: 4px 8px;
    font-size: 10px;
  }

  .gallery-section {
    margin-top: 60px;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .gallery-image-wrapper {
    height: 120px;
  }

  .gallery-card-info {
    padding: 12px;
  }

  .gallery-card-info h3 {
    font-size: 14px;
  }

  .section-header h2 {
    font-size: 24px;
  }

  /* Modal responsive */
  .modal-overlay {
    padding: 12px;
  }

  .modal-content {
    max-height: 95vh;
    max-width: 100%;
    border-radius: 16px;
  }

  .modal-close {
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .modal-image {
    min-height: 200px;
    max-height: 50vh;
  }

  .slider-handle {
    width: 36px;
    height: 36px;
  }

  .slider-arrow {
    font-size: 8px;
  }

  .comparison-labels span {
    padding: 4px 8px;
    font-size: 10px;
  }

  .modal-footer {
    padding: 20px;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .modal-info h2 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  .modal-actions {
    justify-content: stretch;
  }

  .modal-delete {
    flex: 0 0 44px;
  }

  .modal-download {
    flex: 1;
    justify-content: center;
  }

  .delete-confirm {
    padding: 20px;
    margin: 12px;
  }

  .delete-confirm p {
    font-size: 15px;
  }
}

/* Extra small screens */
@media (max-width: 400px) {
  .form-section {
    padding: 16px;
  }

  .furniture-items {
    grid-template-columns: 1fr 1fr;
  }

  .gallery-grid {
    grid-template-columns: 1fr 1fr;
  }

  .input-tabs {
    flex-direction: column;
  }

  .tab-btn {
    width: 100%;
  }
}
</style>
