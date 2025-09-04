import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from 'flowbite-react'

const FileList = ({ files }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR')
  }

  const getFileIcon = (extension) => {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff']
    const docExts = ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.pages']
    const videoExts = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']
    const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a']
    const codeExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css']
    const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz']
    const appExts = ['.app', '.exe', '.dmg', '.pkg', '.msi']
    
    if (!extension) return '📄'
    
    const ext = extension.toLowerCase()
    if (imageExts.includes(ext)) return '🖼️'
    if (docExts.includes(ext)) return '📄'
    if (videoExts.includes(ext)) return '🎬'
    if (audioExts.includes(ext)) return '🎵'
    if (codeExts.includes(ext)) return '💻'
    if (archiveExts.includes(ext)) return '🗜️'
    if (appExts.includes(ext)) return '📱'
    if (ext === '.ds_store') return '👻' // macOS 숨김 파일
    
    return '📁'
  }

  const getFileTypeCategory = (extension) => {
    const categories = {
      '🖼️': 'image',
      '📄': 'document', 
      '🎬': 'video',
      '🎵': 'audio',
      '💻': 'code',
      '🗜️': 'archive',
      '📱': 'application',
      '👻': 'system'
    }
    
    const icon = getFileIcon(extension)
    return categories[icon] || 'other'
  }

  const getCategoryColor = (category) => {
    const colors = {
      image: 'bg-purple-100 text-purple-800',
      document: 'bg-blue-100 text-blue-800',
      video: 'bg-red-100 text-red-800',
      audio: 'bg-green-100 text-green-800',
      code: 'bg-yellow-100 text-yellow-800',
      archive: 'bg-orange-100 text-orange-800',
      application: 'bg-pink-100 text-pink-800',
      system: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors.other
  }

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        표시할 파일이 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto max-h-96">
      <Table hoverable striped>
        <TableHead>
          <TableRow>
            <TableHeadCell>파일명</TableHeadCell>
            <TableHeadCell>크기</TableHeadCell>
            <TableHeadCell>수정일</TableHeadCell>
            <TableHeadCell>종류</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody className="divide-y">
          {files.map((file, index) => {
            const category = getFileTypeCategory(file.extension)
            const categoryColor = getCategoryColor(category)
            
            return (
              <TableRow key={index} className="bg-white hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {getFileIcon(file.extension)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate max-w-xs font-medium">
                        {file.name}
                      </div>
                      {file.path && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {file.path}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 whitespace-nowrap">
                  {formatFileSize(file.size)}
                </TableCell>
                <TableCell className="text-gray-600 whitespace-nowrap">
                  {formatDate(file.modified)}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColor}`}>
                    {file.extension || 'None'}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default FileList