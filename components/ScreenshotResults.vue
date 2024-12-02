<template>
  <div v-if="results.length" class="space-y-4">
    <h2 class="text-xl font-semibold">Results:</h2>
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
                  @click="onDownload(result)"
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

<script lang="ts" setup>
import type { ScreenshotResult } from '~/types/screenshot'

defineProps<{
  results: ScreenshotResult[]
  isProcessing: boolean
  completedUrls: number
  totalUrls: number
}>()

const emit = defineEmits<{
  download: [result: ScreenshotResult]
}>()

function onDownload(result: ScreenshotResult) {
  emit('download', result)
}
</script>