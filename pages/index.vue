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

      <div v-if="showForm">
        <div class="mb-6 space-y-4">
          <div class="flex justify-between items-center">
            <UInput
                v-model="newSetName"
                class="max-w-xs"
                placeholder="URL Set Name"
            />
            <div class="space-x-2">
              <UButton
                  v-if="isEditMode"
                  :disabled="!urlsSaveable || savingUrlSet"
                  variant="soft"
                  @click="saveCurrentUrls"
              >
                {{ savingUrlSet ? "Saving..." : "Save Changes" }}
              </UButton>
              <UButton
                  v-if="isEditMode"
                  :disabled="savingUrlSet"
                  variant="soft"
                  @click="cancelEdit"
              >
                Cancel
              </UButton>
              <UButton
                  v-if="!isEditMode"
                  :disabled="!urlsSaveable"
                  variant="soft"
                  @click="saveCurrentUrls"
              >
                Save New Set
              </UButton>
            </div>
          </div>

          <USelect
              :options="urlSets"
              :value="selectedSetId"
              option-attribute="name"
              placeholder="Load saved URL set"
              value-attribute="id"
              @update:model-value="loadUrlSet"
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
                :disabled="isProcessing"
                :rows="6"
                placeholder="https://example.com&#10;https://google.com"
            />
          </UFormGroup>

          <UDivider/>

          <ScreenshotOptions :disabled="isProcessing" :form-state="formState"/>

          <div class="flex justify-between items-center">
            <UButton
                :disabled="isProcessing || !formState.urls.trim()"
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
      </div>
      <template v-if="isProcessing">
        <UCard class="p-4">
          <h2 class="text-xl font-semibold mb-2">
            Processing URLs... {{ completedUrls }} / {{ totalUrls }}
          </h2>
          <UProgress
              :value="(completedUrls / totalUrls) * 100"
              color="primary"
          />
        </UCard>
      </template>
      <template v-else-if="hasSuccessfulScreenshots && !isProcessing">
        <div class="mt-4 flex justify-end space-x-2">
          <UButton
              variant="soft"
              @click="resetAndShowForm"
          >
            Take New Screenshots
          </UButton>
          <UButton
              variant="soft"
              @click="clearResults"
          >
            Clear Results
          </UButton>
        </div>
      </template>
      <template #footer>
        <ScreenshotResults
            :completed-urls="completedUrls"
            :is-processing="isProcessing"
            :results="results"
            :total-urls="totalUrls"
            @download="downloadScreenshot"
        />
        <div v-if="hasSuccessfulScreenshots && !isProcessing" class="mt-4 flex justify-end space-x-2">
          <UButton
              variant="soft"
              @click="resetAndShowForm"
          >
            Take New Screenshots
          </UButton>
          <UButton
              variant="soft"
              @click="clearResults"
          >
            Clear Results
          </UButton>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>

<script lang="ts" setup>
import { DEVICE_PRESETS, type ScreenshotOptions } from "~/types/screenshot"

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

const {saveUrlSet, getUrlSets, deleteUrlSet, updateUrlSet} = useUrlStorage()
const {
  isProcessing,
  isDownloading,
  results,
  completedUrls,
  totalUrls,
  hasSuccessfulScreenshots,
  processInBatches,
  downloadScreenshot,
  downloadAllScreenshots
} = useScreenshots()

const urlSets = ref<UrlSet[]>([])
const newSetName = ref("")
const selectedSetId = useCookie<string>("selectedSetId", {
  default: () => "",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  sameSite: "strict",
  path: "/",  // Ensure cookie is available across all paths
  watch: true
})

const isEditMode = ref(false)
const showForm = ref(true)

function clearResults() {
  results.value = []
  completedUrls.value = 0
  totalUrls.value = 0
  showForm.value = true

}

function resetAndShowForm() {
  clearResults()
  if (!isEditMode.value) {
    formState.urls = ""
  }
  showForm.value = true
}

const formState = reactive<FormState>({
  urls: "",
  viewport: {
    width: 1920,
    height: 1080
  },
  delay: 2000,
  devicePresetName: "Desktop",
  concurrency: 2,
  retryCount: 2,
  retryDelay: 2000
})

const urlsSaveable = computed(() =>
   formState.urls.trim().length > 0 && newSetName.value.trim().length > 0
)

onMounted(async () => {
  await loadUrlSets()
  console.log("Initial cookie value:", selectedSetId.value)
  // Check for non-empty string instead of undefined
  if (selectedSetId.value && selectedSetId.value !== "" && urlSets.value.length > 0) {
    const selectedSet = urlSets.value.find(s => s.id.toString() === selectedSetId.value.toString())
    if (selectedSet) {
      // Load the set data
      formState.urls = selectedSet.urls.join("\n")
      newSetName.value = selectedSet.name
      isEditMode.value = true
    } else {
      // If the set no longer exists, clear the cookie
      selectedSetId.value = ""
      formState.urls = ""
      newSetName.value = ""
      isEditMode.value = false
    }
  }

  formState.devicePresetName = DEVICE_PRESETS[0].name
})

async function loadUrlSets() {
  urlSets.value = await getUrlSets()
}

const savingUrlSet = ref(false)

async function saveCurrentUrls() {
  if (!formState.urls.trim() || !newSetName.value.trim()) return

  const urls = formState.urls.split("\n")
     .map(url => url.trim())
     .filter(Boolean)

  savingUrlSet.value = true

  try {
    // If we're in edit mode but the name has changed, create a new set
    if (isEditMode.value && selectedSetId.value) {
      const currentSet = urlSets.value.find(s => s.id === selectedSetId.value)
      if (currentSet && currentSet.name === newSetName.value) {
        // Same name, update existing set
        await updateUrlSet(selectedSetId.value, urls)
        const currentId = selectedSetId.value
        await loadUrlSets()
        selectedSetId.value = currentId
      } else {
        // Name changed, create new set
        const newSet = await saveUrlSet(newSetName.value, urls)
        selectedSetId.value = newSet.id
        await loadUrlSets()
      }
    } else {
      // Not in edit mode, always create new set
      const newSet = await saveUrlSet(newSetName.value, urls)
      if (newSet.id) {
        selectedSetId.value = newSet.id
      }
      await loadUrlSets()
    }

    isEditMode.value = true
  } finally {
    savingUrlSet.value = false
  }
}

async function loadUrlSet(id: string) {
  const set = urlSets.value.find(s => s.id === id)
  if (set) {
    isEditMode.value = true
    newSetName.value = set.name
    formState.urls = set.urls.join("\n")
    selectedSetId.value = id  // Update cookie
  } else {
    console.warn(`URL set not found: ${id}`)
    isEditMode.value = false
    newSetName.value = ""
    formState.urls = ""
    selectedSetId.value = undefined  // Clear cookie
  }
}

function cancelEdit() {
  isEditMode.value = false
  selectedSetId.value = ""  // Use empty string instead of undefined
  newSetName.value = ""
  formState.urls = ""
}


async function deleteSet(id?: string) {
  if (!id) return

  try {
    await deleteUrlSet(id)
    if (id === selectedSetId.value) {
      selectedSetId.value = ""  // Use empty string instead of undefined
      isEditMode.value = false
      newSetName.value = ""
      formState.urls = ""
    }
    await loadUrlSets()
  } catch (error) {
    console.error("Failed to delete URL set:", error)
  }
}

async function processUrls(e: Event) {
  e.preventDefault() // Prevent form submission

  if (!formState.urls?.trim()) {
    alert("Please enter at least one URL to process.")
    return
  } else if (isProcessing.value) {
    alert("A batch process is already in progress.")
    return
  }

  const urls = formState.urls.split("\n")
     .map(url => url.trim())
     .filter(Boolean)

  totalUrls.value = urls.length // Set total URLs before processing
  console.log(`Processing ${totalUrls.value} URLs...`)
  showForm.value = false
  try {
    isProcessing.value = true
    const options: ScreenshotOptions = {
      viewport: formState.viewport,
      delay: formState.delay,
      retryCount: formState.retryCount,
      retryDelay: formState.retryDelay,
      devicePreset: formState.devicePresetName,
      concurrency: formState.concurrency // Make sure this is included
    }
    await processInBatches(urls, options)
  } catch (error) {
    console.error("Failed to process URLs:", error)
    alert("Failed to process URLs. Please check the console for more details.")
  } finally {
    console.log("Processing complete.")
    isProcessing.value = false
  }
}

</script>