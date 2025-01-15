import { app, BrowserWindow, ipcMain } from 'electron'
import * as isDev from 'electron-is-dev'
import * as path from 'path'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

// and load the index.html of the app.
if (isDev) {
mainWindow.loadURL('http://localhost:2003')
// Open the DevTools in development mode.
mainWindow.webContents.openDevTools()
} else {
mainWindow.loadFile(path.join(__dirname, 'index.html'))
}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Set up IPC handlers
ipcMain.handle('ping', async () => {
return 'pong'
})

// Error handling
process.on('uncaughtException', (error) => {
console.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (error) => {
console.error('Unhandled rejection:', error)
})
