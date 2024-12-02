<template>
  <UContainer class="py-10">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">Batch Screenshot Tool</h1>
          <UButton
              v-if="hasSuccessfulScreenshots"
              :loading="isDownloading"
              color="gray"
              icon="i-heroicons-archive-box"
              @click="downloadAllScreenshots"
          >
            Download All
          </UButton>
        </div>
      </template>

      <div class="mb-6 space-y-4">
        <div class="flex justify-between items-center">
          <UInput
              v-model="newSetName"
              class="max-w-xs"
              placeholder="URL Set Name"
          />
          <UButton
              :disabled="!urlsSaveable"
              variant="soft"
              @click="saveCurrentUrls"
          >
            Save Current URLs
          </UButton>
        </div>
        {{selectedSetId}}
        <USelect
            v-if="urlSets.length"
            :value="selectedSetId"
            :options="urlSets"
            option-attribute="name"
            value-attribute="id"
            placeholder="Load saved URL set"
            @update:model-value="loadUrlSet($event)"
        >
          <template #option="{ option: set }">
            <div class="flex justify-between items-center w-full">
              <span>{{ set.name }}</span>
              <div class="flex gap-2">
          <span class="text-sm text-gray-500">
            {{ set.urls.length }} URLs
          </span>
                <UButton
                    color="red"
                    icon="i-heroicons-trash"
                    size="xs"
                    variant="ghost"
                    @click.stop="deleteSet(set.id)"
                />
              </div>
            </div>
          </template>
        </USelect>
      </div>

      <UForm :state="formState" class="space-y-6" @submit="processUrls">
        <UFormGroup label="Enter URLs (one per line)" name="urls">
          <UTextarea
              v-model="formState.urls"
              :rows="6"
              placeholder="https://example.com&#10;https://google.com"
          />
        </UFormGroup>

        <UDivider/>

        <UAccordion :items="[{ label: 'Screenshot Options', slot: 'options' }]" :default-open="true">
          <template #options>
            <div class="space-y-4 p-4">
              <UFormGroup label="Device Preset" name="devicePreset">
                <USelect
                    v-model="formState.devicePresetName"
                    :options="DEVICE_PRESETS"
                    option-attribute="name"
                    placeholder="Select a device or custom size"
                    value-attribute="name"
                    @update:modelValue="updateViewportFromPreset"
                />
              </UFormGroup>

              <UFormGroup
                  v-if="formState.devicePresetName === 'Custom'"
                  label="Custom Viewport Size"
                  name="viewport"
              >
                <div class="flex gap-4">
                  <UInput
                      v-model="formState.viewport.width"
                      max="3840"
                      min="320"
                      placeholder="Width"
                      type="number"
                  >
                    <template #leading>W</template>
                  </UInput>
                  <UInput
                      v-model="formState.viewport.height"
                      max="2160"
                      min="320"
                      placeholder="Height"
                      type="number"
                  >
                    <template #leading>H</template>
                  </UInput>
                </div>
              </UFormGroup>

              <UFormGroup label="Delay before capture (ms)" name="delay">
                <UInput
                    v-model="formState.delay"
                    max="10000"
                    min="0"
                    step="500"
                    type="number"
                />
              </UFormGroup>

              <UFormGroup label="Retry Options" name="retry">
                <div class="flex gap-4">
                  <UInput
                      v-model="formState.retryCount"
                      label="Retry Attempts"
                      max="5"
                      min="0"
                      type="number"
                  />
                  <UInput
                      v-model="formState.retryDelay"
                      label="Retry Delay (ms)"
                      max="10000"
                      min="1000"
                      step="1000"
                      type="number"
                  />
                </div>
              </UFormGroup>

              <UFormGroup label="Concurrent screenshots" name="concurrency">
                <URange
                    v-model="formState.concurrency"
                    :max="5"
                    :min="1"
                    :step="1"
                />
                <span class="text-sm text-gray-500">
                  Processing {{ formState.concurrency }} URLs at once
                </span>
              </UFormGroup>
            </div>
          </template>
        </UAccordion>

        <div class="flex justify-between items-center">
          <UButton
              :disabled="isProcessing"
              :loading="isProcessing"
              color="primary"
              type="submit"
          >
            {{ isProcessing ? "Processing..." : "Take Screenshots" }}
          </UButton>

          <span v-if="isProcessing" class="text-sm text-gray-500">
            {{ completedUrls }} / {{ totalUrls }} completed
          </span>
        </div>
      </UForm>

      <template v-if="results.length" #footer>
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">Results:</h2>
          <UProgress
              v-if="isProcessing"
              :value="(completedUrls / totalUrls) * 100"
              color="primary"
          />

          <div class="space-y-2">
            <UCard
                v-for="(result, index) in results"
                :key="index"
                :ui="{ base: 'p-4', background: result.status === 'success' ? 'bg-green-50' : 'bg-red-50' }"
            >
              <div class="flex gap-4">
                <img
                    v-if="result.status === 'success' && result.thumbnailPath"
                    :src="result.thumbnailPath"
                    alt="Screenshot thumbnail"
                    class="w-32 h-24 object-cover rounded border"
                />
                <div class="flex-1">
                  <p class="font-medium">{{ result.url }}</p>
                  <template v-if="result.status === 'success'">
                    <div class="mt-2 flex gap-2">
                      <UButton
                          :to="result.path"
                          color="primary"
                          size="sm"
                          target="_blank"
                          variant="soft"
                      >
                        View Screenshot
                      </UButton>
                      <UButton
                          color="gray"
                          icon="i-heroicons-arrow-down-tray"
                          size="sm"
                          variant="soft"
                          @click="downloadScreenshot(result)"
                      >
                        Download
                      </UButton>
                    </div>
                  </template>
                  <template v-else>
                    <div class="mt-2">
                      <p class="text-red-600">
                        Error: {{ result.error }}
                        <template v-if="result.attempts && result.attempts > 1">
                          (After {{ result.attempts }} attempts)
                        </template>
                      </p>
                    </div>
                  </template>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>

<script lang="ts" setup>
import JSZip from "jszip"
import { saveAs } from "file-saver"
import type { DevicePreset, ScreenshotOptions, ScreenshotResult } from "~/types/screenshot"
import { DEVICE_PRESETS } from "~/types/screenshot"


const { saveUrlSet, getUrlSets, deleteUrlSet } = useUrlStorage()
const urlSets = ref<UrlSet[]>([])
const newSetName = ref('')
const selectedSetId = ref<number>()

const urlsSaveable = computed(() => formState.urls.trim().length>0 && newSetName.value.trim().length>0)

onMounted(async () => {
  await loadUrlSets()
})

async function loadUrlSets() {
  urlSets.value = await getUrlSets()
}

async function saveCurrentUrls() {
  if (!formState.urls.trim() || !newSetName.value.trim()) return

  const urls = formState.urls.split('\n')
    .map(url => url.trim())
    .filter(Boolean)

  await saveUrlSet(newSetName.value, urls)
  newSetName.value = ''
  await loadUrlSets()
}

async function loadUrlSet(id: number) {
  console.log('Loading URL set:', {id})
  const set = urlSets.value.find(s => s.id.toString() === id)
  if (set) {
    newSetName.value = set.name
    formState.urls = set.urls.join('\n')
  } else {
    console.log('URL set not found:', id)
    formState.urls = ''
  }
  selectedSetId.value = undefined
}

async function deleteSet(id?: number) {
  if (!id) return

  try {
    await deleteUrlSet(id)
    await loadUrlSets()
  } catch (error) {
    console.error('Failed to delete URL set:', error)
  }
}

interface FormState {
  urls: string
  viewport: {
    width: number
    height: number
  }
  delay: number
  devicePresetName: string
  concurrency: number
  retryCount: number
  retryDelay: number
}

const formState = reactive<FormState>({
  urls: "",
  viewport: {
    width: 1920,
    height: 1080
  },
  delay: 2000,
  devicePresetName: "Custom",
  concurrency: 2,
  retryCount: 2,
  retryDelay: 2000
})


const isProcessing = ref(false)
const isDownloading = ref(false)
const results = ref<ScreenshotResult[]>([])
const completedUrls = ref(0)
const totalUrls = ref(0)


const devicePreset = computed(() =>
   DEVICE_PRESETS.find(preset => preset.name === formState.devicePresetName)
)

watch(devicePreset, () => {
  if (devicePreset.value) updateViewportFromPreset(devicePreset.value)
})

const hasSuccessfulScreenshots = computed(() =>
   results.value.some(r => r.status === "success")
)

// URL validation regex
const URL_REGEX = /^https?:\/\/.+\..+/i

function validateUrls(urls: string[]): string[] {
  return urls.filter(url => URL_REGEX.test(url))
}

function updateViewportFromPreset(preset: DevicePreset | null) {
  if (preset) {
    formState.viewport.height = preset.height
    formState.viewport.width = preset.width
  }
}

async function processWithRetry(url: string, options: ScreenshotOptions): Promise<ScreenshotResult> {
  let attempts = 0
  while (attempts <= options.retryCount) {
    attempts++
    try {
      const response = await $fetch<ScreenshotResult>("/api/screenshots", {
        method: "POST",
        body: {url, options}
      })
      if (response.status === "success") {
        return {...response, attempts}
      }
      await new Promise(resolve => setTimeout(resolve, options.retryDelay))
    } catch (error) {
      if (attempts > options.retryCount) {
        return {
          url,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          attempts
        }
      }
      await new Promise(resolve => setTimeout(resolve, options.retryDelay))
    }
  }
  return {
    url,
    status: "error",
    error: `Failed after ${attempts} attempts`,
    attempts
  }
}

async function processInBatches(urls: string[]) {
  const validUrls = validateUrls(urls)
  totalUrls.value = validUrls.length
  completedUrls.value = 0
  results.value = []

  const options: ScreenshotOptions = {
    viewport: formState.viewport,
    delay: formState.delay,
    retryCount: formState.retryCount,
    retryDelay: formState.retryDelay
  }

  if (formState.devicePresetName && devicePreset.value) {
    options.devicePreset = formState.devicePresetName
    options.userAgent = devicePreset.value.userAgent
    options.isMobile = devicePreset.value.isMobile
  }

  for (let i = 0; i < validUrls.length; i += formState.concurrency) {
    const batch = validUrls.slice(i, i + formState.concurrency)
    const promises = batch.map(url => processWithRetry(url, options))
    const batchResults = await Promise.all(promises)
    results.value.push(...batchResults)
    completedUrls.value += batch.length
  }
}

async function downloadScreenshot(result: ScreenshotResult) {
  if (result.status !== "success" || !result.path) return

  const response = await fetch(result.path)
  const blob = await response.blob()
  const filename = result.filename || "screenshot.png"
  saveAs(blob, filename)
}

async function downloadAllScreenshots() {
  if (!hasSuccessfulScreenshots.value) return

  isDownloading.value = true
  try {
    const zip = new JSZip()
    const successfulResults = results.value.filter(r => r.status === "success" && r.path)

    for (const result of successfulResults) {
      if (result.path) {
        const response = await fetch(result.path)
        const blob = await response.blob()
        zip.file(result.filename || "screenshot.png", blob)
      }
    }

    const content = await zip.generateAsync({type: "blob"})
    saveAs(content, `screenshots-${Date.now()}.zip`)
  } finally {
    isDownloading.value = false
  }
}

async function processUrls() {
  if (!formState.urls.trim()) {
    return
  }

  isProcessing.value = true
  const urls = formState.urls.split("\n").map(url => url.trim()).filter(Boolean)

  try {
    await processInBatches(urls)
  } finally {
    isProcessing.value = false
  }
}
</script>