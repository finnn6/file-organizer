const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

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

// 중복 파일 탐색 (정확한 방식)
ipcMain.handle('find-duplicate-files', async (event, folderPath) => {
  try {
    console.log('중복 파일 탐색 시작:', folderPath)
    
    const allFiles = await getAllFilesRecursively(folderPath)
    const fileHashes = new Map()
    const duplicateGroups = []
    
    for (const file of allFiles) {
      try {
        // 빈 파일 제외
        if (file.size === 0) {
          console.log(`빈 파일 제외: ${file.name}`)
          continue
        }
        
        const hash = await calculateFileHash(file.path)
        
        if (fileHashes.has(hash)) {
          fileHashes.get(hash).push(file)
        } else {
          fileHashes.set(hash, [file])
        }
      } catch (error) {
        console.error(`파일 해시 계산 실패: ${file.path}`, error)
      }
    }
    
    for (const [hash, files] of fileHashes) {
      if (files.length > 1) {
        files.sort((a, b) => new Date(a.modified) - new Date(b.modified))

        duplicateGroups.push({
          hash,
          files,
          original: files[0],
          duplicates: files.slice(1),
          totalSize: files.reduce((sum, file) => sum + file.size, 0),
          duplicateSize: files.slice(1).reduce((sum, file) => sum + file.size, 0)
        })
      }
    }
    
    const duplicateFiles = []
    for (const group of duplicateGroups) {
      for (const file of group.files) {
        duplicateFiles.push({
          ...file,
          isOriginal: file === group.original,
          duplicateGroup: group.hash,
          groupSize: group.files.length,
          canDelete: file !== group.original
        })
      }
    }
    
    return {
      duplicateFiles,
      duplicateGroups,
      summary: {
        totalDuplicates: duplicateFiles.length,
        totalGroups: duplicateGroups.length,
        totalWastedSpace: duplicateGroups.reduce((sum, group) => sum + group.duplicateSize, 0)
      }
    }
    
  } catch (error) {
    console.error('중복 파일 탐색 에러:', error)
    throw error
  }
})

// 중복 파일 정리
ipcMain.handle('clean-duplicate-files', async (event, duplicateData) => {
  try {
    const { duplicateGroups } = duplicateData
    let deletedCount = 0
    let freedSpace = 0
    const errors = []
    
    for (const group of duplicateGroups) {
      for (const duplicate of group.duplicates) {
        try {
          await fs.unlink(duplicate.path)
          deletedCount++
          freedSpace += duplicate.size
        } catch (error) {
          errors.push({
            file: duplicate.path,
            error: error.message
          })
        }
      }
    }
    
    return {
      success: true,
      deletedCount,
      freedSpace,
      errors
    }
    
  } catch (error) {
    console.error('중복 파일 정리 에러:', error)
    throw error
  }
})

// === 헬퍼 함수들 ===
async function getAllFilesRecursively(folderPath, maxDepth = 10, currentDepth = 0) {
  const files = []
  
  if (currentDepth >= maxDepth) return files
  
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name)
      
      try {
        if (entry.isFile()) {
          const stats = await fs.stat(fullPath)
          files.push({
            name: entry.name,
            path: fullPath,
            size: stats.size,
            modified: stats.mtime,
            extension: path.extname(entry.name).toLowerCase(),
            directory: folderPath
          })
        } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const subFiles = await getAllFilesRecursively(fullPath, maxDepth, currentDepth + 1)
          files.push(...subFiles)
        }
      } catch (error) {
        console.error(`파일 정보 읽기 실패: ${fullPath}`, error)
      }
    }
  } catch (error) {
    console.error(`폴더 읽기 실패: ${folderPath}`, error)
  }
  
  return files
}

async function calculateFileHash(filePath) {
  const hash = crypto.createHash('sha256')
  const stream = require('fs').createReadStream(filePath)
  
  return new Promise((resolve, reject) => {
    stream.on('data', data => hash.update(data))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

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