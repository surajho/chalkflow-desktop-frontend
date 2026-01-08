# Chalkflow Desktop

Electron desktop application for extracting and managing BTWB workout data.

## Features

- Extract workout data from BTWB
- View and analyze workout history
- Export to multiple formats (JSON, CSV, Excel, PDF)
- Secure local processing (credentials never leave your machine)

## Development

### Prerequisites

- Node.js 18+ and Yarn 4 (automatically installed per-project)
- Python 3.12+ (for the backend)

### Setup

1. Install dependencies:

```bash
yarn install
```

2. Build TypeScript:

```bash
yarn build
```

3. Run in development mode:

```bash
yarn dev
```

### Project Structure

```
desktop-frontend/
├── src/
│   ├── main/           # Main process (Electron)
│   ├── preload/        # Preload scripts (IPC bridge)
│   └── renderer/       # Renderer process (React UI)
├── assets/             # App icons and resources
├── dist/               # Compiled TypeScript output
└── release/            # Built installers
```

## Building

### All platforms

```bash
yarn dist
```

### Specific platform

```bash
yarn dist:win    # Windows
yarn dist:mac    # macOS
yarn dist:linux  # Linux
```

## Architecture

- **Main Process**: Manages windows, launches Python backend, handles system integration
- **Preload Script**: Secure IPC bridge using contextBridge
- **Renderer Process**: React-based UI for user interaction
- **Python Backend**: FastAPI server for BTWB scraping and data processing

## Security

- `nodeIntegration` is disabled
- `contextIsolation` is enabled
- IPC communication uses secure contextBridge
- Python backend runs locally only

## License

MIT
