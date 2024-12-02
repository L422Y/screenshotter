// types/screenshot.ts
export interface DevicePreset {
  name: string
  width: number
  height: number
  userAgent: string
  isMobile: boolean
}

export interface ScreenshotOptions {
  viewport: {
    width: number
    height: number
  }
  delay: number
  devicePreset?: string
  isMobile?: boolean
  userAgent?: string
  retryCount: number
  retryDelay: number
}

export interface ScreenshotResult {
  url: string
  status: "success" | "error"
  filename?: string
  path?: string
  thumbnailPath?: string
  error?: string
  attempts?: number
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    name: "Custom",
    width: 1280,
    height: 720,
    userAgent: "desktop",
    isMobile: false
  },
  {
    name: "Desktop",
    width: 1920,
    height: 1080,
    userAgent: "desktop",
    isMobile: false
  },
  {
    name: "iPhone 13",
    width: 390,
    height: 844,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    isMobile: true
  },
  {
    name: "Pixel 6",
    width: 412,
    height: 915,
    userAgent: "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.101 Mobile Safari/537.36",
    isMobile: true
  },
  {
    name: "iPad",
    width: 820,
    height: 1180,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    isMobile: true
  }
]