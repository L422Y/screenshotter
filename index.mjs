import { chromium } from 'playwright'
import path from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function takeScreenshot(url, outputPath) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(url, {waitUntil: 'networkidle'})
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: outputPath,
      fullPage: true
    })

    console.log(`Screenshot saved to: ${outputPath}`)
  } catch (error) {
    console.error(`Error taking screenshot of ${url}: ${error}`)
  } finally {
    await browser.close()
  }
}

async function processUrlFile(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const urls = fileContent
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && url.length > 0)

    console.log(`Found ${urls.length} URLs to process`)

    for (const url of urls) {
      const filename = `screenshot-${url
        .replace(/[^a-zA-Z0-9]/g, '-')
        .substring(0, 100)}-${Date.now()}.png`
      const outputPath = path.join(process.cwd(), 'screenshots', filename)

      await fs.mkdir(path.join(process.cwd(), 'screenshots'), {recursive: true})

      console.log(`Processing: ${url}`)
      await takeScreenshot(url, outputPath)
    }

    console.log('All URLs processed')
  } catch (error) {
    console.error(`Error processing URL file: ${error}`)
  }
}

// Check if being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const urlFile = process.argv[2]

  if (!urlFile) {
    console.error('Please provide a path to the URL file as an argument')
    console.error('Usage: node screenshot.mjs urls.txt')
    process.exit(1)
  }

  processUrlFile(urlFile)
    .catch(console.error)
}