import { chromium } from 'playwright'
import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'
import type { DevicePreset } from '~/types/screenshot'

interface RequestBody {
  url: string
  options: {
    viewport: {
      width: number
      height: number
    }
    delay: number
    devicePreset?: string
    userAgent?: string
    isMobile?: boolean
    retryCount: number
    retryDelay: number
  }
}

interface ScreenshotResult {
  url: string
  status: 'success' | 'error'
  filename?: string
  path?: string
  thumbnailPath?: string
  error?: string
  attempts?: number
}

async function createThumbnail(screenshotPath: string, thumbnailPath: string): Promise<void> {
  await sharp(screenshotPath)
    .resize(320, 240, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toFile(thumbnailPath)
}

export default defineEventHandler(async (event): Promise<ScreenshotResult> => {
  const { url, options } = await readBody<RequestBody>(event)
  const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots')
  const thumbnailsDir = path.join(screenshotsDir, 'thumbnails')

  // Ensure directories exist
  await fs.mkdir(screenshotsDir, { recursive: true })
  await fs.mkdir(thumbnailsDir, { recursive: true })

  // Initialize attempt counter
  let attempts = 0
  let lastError: Error | null = null

  while (attempts <= options.retryCount) {
    attempts++
    const browser = await chromium.launch()

    try {
      // Configure browser context with device settings
      const context = await browser.newContext({
        viewport: options.viewport,
        userAgent: options.userAgent,
        isMobile: options.isMobile,
        deviceScaleFactor: options.isMobile ? 2 : 1,
        hasTouch: options.isMobile
      })

      const page = await context.newPage()

      try {
        // Navigate with retry-specific timeout
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 30000 + (attempts * 5000) // Increase timeout with each retry
        })

        // Wait for any animations or dynamic content
        await page.waitForTimeout(options.delay)

        // Generate filenames
        const filename = `screenshot-${url
          .replace(/[^a-zA-Z0-9]/g, '-')
          .substring(0, 100)}-${Date.now()}.png`
        const thumbnailFilename = `thumb-${filename}`

        const outputPath = path.join(screenshotsDir, filename)
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename)

        // Take screenshot
        await page.screenshot({
          path: outputPath,
          fullPage: true
        })

        // Generate thumbnail
        await createThumbnail(outputPath, thumbnailPath)

        return {
          url,
          status: 'success',
          filename,
          path: `/screenshots/${filename}`,
          thumbnailPath: `/screenshots/thumbnails/${thumbnailFilename}`,
          attempts
        }
      } catch (error) {
        lastError = error as Error
        // Only throw if we've exhausted retries
        if (attempts > options.retryCount) {
          throw error
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, options.retryDelay))
      } finally {
        await context.close()
      }
    } catch (error) {
      lastError = error as Error
      if (attempts > options.retryCount) {
        return {
          url,
          status: 'error',
          error: lastError?.message || 'Unknown error',
          attempts
        }
      }
    } finally {
      await browser.close()
    }
  }

  // This should never be reached due to the return in the error case above,
  // but TypeScript doesn't know that
  return {
    url,
    status: 'error',
    error: lastError?.message || 'Unknown error',
    attempts
  }
})