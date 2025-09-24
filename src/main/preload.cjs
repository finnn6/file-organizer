const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getFiles: (folderPath) => ipcRenderer.invoke('get-files', folderPath),

  // 중복 파일 관리
  findDuplicateFiles: (folderPath) => ipcRenderer.invoke('find-duplicate-files', folderPath),
  cleanDuplicateFiles: (duplicateData) => ipcRenderer.invoke('clean-duplicate-files', duplicateData)
})