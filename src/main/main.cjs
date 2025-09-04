const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs').promises
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile('dist-renderer/index.html')
  }
}

// 폴더 선택 다이얼로그
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '정리할 폴더를 선택하세요'
  })
  
  return result.canceled ? null : result.filePaths[0]
})

// 폴더 내 파일 목록 가져오기
ipcMain.handle('get-files', async (event, folderPath) => {
  try {
    const files = await fs.readdir(folderPath, { withFileTypes: true })
    const fileList = []
    
    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(folderPath, file.name)
        const stats = await fs.stat(filePath)
        
        fileList.push({
          name: file.name,
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
          extension: path.extname(file.name).toLowerCase()
        })
      }
    }
    
    return fileList
  } catch (error) {
    console.error('파일 읽기 에러:', error)
    return []
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})