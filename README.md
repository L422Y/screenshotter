# Batch Screenshot Tool

A powerful web tool built with Nuxt 3 that allows you to take and manage batch screenshots of multiple URLs simultaneously. The tool uses Playwright for high-quality screenshots and includes features like concurrent processing, retry mechanisms, and URL set management.

Currently meant to run locally, this tool is ideal for web developers, designers, and QA testers who need to capture screenshots of multiple URLs for testing, documentation, or presentation purposes.

Note: This project is still in development and may contain bugs or incomplete features.

## Features

- **Batch Processing**: Take screenshots of multiple URLs concurrently
- **URL Set Management**: Save and load sets of URLs for repeated use
- **Flexible Device Presets**: Choose from predefined device viewports or set custom dimensions
- **Retry Mechanism**: Automatically retry failed screenshots with configurable attempts and delays
- **Progress Tracking**: Real-time progress monitoring with detailed status updates
- **Results Management**: 
  - View thumbnails of successful screenshots
  - Download individual screenshots
  - Batch download all screenshots as a ZIP file
- **Error Handling**: Detailed error reporting for failed screenshots
- **Customization Options**:
  - Viewport dimensions
  - Capture delay
  - Concurrent processing limit
  - Retry attempts and delays

## Prerequisites

- Node.js 16.x or later
- Playwright needs to be installed (will be installed with dependencies)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/L422Y/screenshotter/
cd batch-screenshot-tool
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Development

Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`

## Production

1. Build the application:
```bash
npm run build
# or
yarn build
# or
pnpm build
```

2. Preview the production build:
```bash
npm run preview
# or
yarn preview
# or
pnpm preview
```

## Usage

1. **Enter URLs**:
   - Type or paste URLs (one per line) in the input area
   - Optionally save the URL set with a name for future use

2. **Configure Screenshot Options**:
   - Select a device preset or set custom viewport dimensions
   - Adjust the capture delay if needed for dynamic content
   - Set concurrent processing limit based on your needs
   - Configure retry settings for handling failures

3. **Process Screenshots**:
   - Click "Take Screenshots" to start the batch process
   - Monitor progress in real-time
   - View results as they complete

4. **Manage Results**:
   - View thumbnails and full screenshots
   - Download individual screenshots
   - Download all successful screenshots as a ZIP file
   - Clear results or take new screenshots as needed

## Technical Details

- Built with Nuxt 3 and Vue 3
- Uses Playwright for browser automation
- Implements concurrent processing with configurable limits
- Includes automatic retry mechanism for failed attempts
- Generates thumbnails using Sharp
- Supports ZIP download using JSZip
- Persistent storage for URL sets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
