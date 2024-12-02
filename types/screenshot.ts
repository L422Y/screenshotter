export interface DevicePreset {
  name: string
  width: number
  height: number
  userAgent?: string
  isMobile?: boolean
}

export interface ScreenshotOptions {
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
  concurrency: number
}

export interface ScreenshotResult {
  url: string
  status: "success" | "error"
  path?: string
  thumbnailPath?: string
  filename?: string
  error?: string
  attempts?: number
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    name: "Custom",
    width: 1920,
    height: 1080
  },
  {
    name: "Desktop HD",
    width: 1920,
    height: 1080
  },
  {
    name: "Desktop",
    width: 1366,
    height: 768
  },
  {
    name: "Tablet",
    width: 768,
    height: 1024,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1",
    isMobile: true
  },
  {
    name: "Mobile",
    width: 375,
    height: 667,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1",
    isMobile: true
  }
]