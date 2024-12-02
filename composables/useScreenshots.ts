import type { ScreenshotOptions, ScreenshotResult } from "~/types/screenshot"
import { saveAs } from "file-saver"
import JSZip from "jszip"

export function useScreenshots() {
  const isProcessing = ref(false)
  const isDownloading = ref(false)
  const results = ref<ScreenshotResult[]>([])
  const completedUrls = ref(0)
  const totalUrls = ref(0)

  const hasSuccessfulScreenshots = computed(() =>
     results.value.some(r => r.status === "success")
  )

  // URL validation regex
  const URL_REGEX = /^https?:\/\/.+\..+/i

  function validateUrls(urls: string[]): string[] {
    return urls.filter(url => URL_REGEX.test(url))
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

  async function processInBatches(urls: string[], options: ScreenshotOptions) {
    const validUrls = validateUrls(urls)
    totalUrls.value = validUrls.length
    completedUrls.value = 0
    results.value = []

    for (let i = 0; i < validUrls.length; i += options.concurrency) {
      const batch = validUrls.slice(i, i + options.concurrency)
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

  return {
    isProcessing,
    isDownloading,
    results,
    completedUrls,
    totalUrls,
    hasSuccessfulScreenshots,
    processInBatches,
    downloadScreenshot,
    downloadAllScreenshots
  }
}