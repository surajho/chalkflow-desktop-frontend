import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let pythonBackend: ChildProcess | null = null;
const BACKEND_PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
    title: 'Chalkflow',
  });

  // Load the index.html
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startPythonBackend(): void {
  // TODO: Implement Python backend launcher
  // This will spawn the FastAPI server from the packaged Python application
  console.warn('Python backend would start here');

  // Example implementation:
  // pythonBackend = spawn('python', ['../desktop-backend/api_server.py']);
  // pythonBackend.stdout?.on('data', (data) => {
  //   console.log(`Backend: ${data}`);
  // });
}

function stopPythonBackend(): void {
  if (pythonBackend) {
    pythonBackend.kill();
    pythonBackend = null;
  }
}

// IPC Handlers
ipcMain.handle('backend:getUrl', () => {
  return BACKEND_URL;
});

ipcMain.handle('backend:call', async (_event, endpoint: string, options: RequestInit) => {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: true, data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  startPythonBackend();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopPythonBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopPythonBackend();
});
