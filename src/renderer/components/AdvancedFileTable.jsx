import React, { useState, useMemo } from 'react'
import { Button, Checkbox, Badge, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Select } from 'flowbite-react'
import { HiChevronUp, HiChevronDown, HiSelector } from 'react-icons/hi'

const AdvancedFileTable = ({ files, showDuplicateInfo = false }) => {
  console.log(files)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // 정렬된 파일 목록
  const sortedFiles = useMemo(() => {
    if (!sortConfig.key) return files

    return [...files].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // 크기나 날짜는 숫자 비교
      if (sortConfig.key === 'size') {
        aValue = a.size || 0
        bValue = b.size || 0
      } else if (sortConfig.key === 'modified') {
        aValue = new Date(a.modified).getTime()
        bValue = new Date(b.modified).getTime()
      } else {
        // 문자열 비교
        aValue = (aValue || '').toString().toLowerCase()
        bValue = (bValue || '').toString().toLowerCase()
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [files, sortConfig])

  // 페이지네이션
  const totalPages = Math.ceil(sortedFiles.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedFiles = sortedFiles.slice(startIndex, startIndex + pageSize)

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <HiSelector className="w-4 h-4 text-gray-400 ml-2" />
    }
    return sortConfig.direction === 'asc' ?
      <HiChevronUp className="w-4 h-4 text-blue-600 ml-2" /> :
      <HiChevronDown className="w-4 h-4 text-blue-600 ml-2" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
    if (ext === '.ds_store') return '👻'

    return '📁'
  }

  const getCategoryColor = (extension) => {
    const icon = getFileIcon(extension)
    const colors = {
      '🖼️': 'purple',
      '📄': 'blue',
      '🎬': 'red',
      '🎵': 'green',
      '💻': 'yellow',
      '🗜️': 'orange',
      '📱': 'pink',
      '👻': 'gray',
    }
    return colors[icon] || 'gray'
  }

  const handleSelectFile = (index) => {
    const fileId = startIndex + index
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  // 행 클릭 핸들러 추가
  const handleRowClick = (index) => {
    handleSelectFile(index)
  }

  // 체크박스 클릭 핸들러 (이벤트 전파 방지)
  const handleCheckboxClick = (e, index) => {
    e.stopPropagation() // 행 클릭 이벤트 전파 방지
    handleSelectFile(index)
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === sortedFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(Array.from({ length: sortedFiles.length }, (_, i) => i)))
    }
  }

  const getTotalSize = () => {
    return Array.from(selectedFiles).reduce((total, index) => {
      return total + (sortedFiles[index]?.size || 0)
    }, 0)
  }

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-4">📂</div>
        <p>표시할 파일이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 테이블 헤더 정보 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            총 {sortedFiles.length.toLocaleString()}개 파일
          </span>
          {selectedFiles.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge color="blue">{selectedFiles.size}개 선택됨</Badge>
              <span className="text-sm text-gray-600">
                ({formatFileSize(getTotalSize())})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">페이지 크기:</span>
          <Select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            sizing="sm"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </Select>
        </div>
      </div>

      {/* Flowbite 테이블 */}
      <div className="overflow-x-auto max-h-96">
        <Table hoverable>
          <TableHead>
            <TableRow>
              <TableHeadCell className="!p-4">
                <Checkbox
                  checked={selectedFiles.size === sortedFiles.length && sortedFiles.length > 0}
                  onChange={handleSelectAll}
                />
              </TableHeadCell>
              {showDuplicateInfo && (
                <TableHeadCell>
                  상태
                </TableHeadCell>
              )}
              <TableHeadCell
                className="cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  파일명
                  {getSortIcon('name')}
                </div>
              </TableHeadCell>
              <TableHeadCell
                className="cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center">
                  크기
                  {getSortIcon('size')}
                </div>
              </TableHeadCell>
              <TableHeadCell
                className="cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('modified')}
              >
                <div className="flex items-center">
                  수정일
                  {getSortIcon('modified')}
                </div>
              </TableHeadCell>
              <TableHeadCell
                className="cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('extension')}
              >
                <div className="flex items-center">
                  종류
                  {getSortIcon('extension')}
                </div>
              </TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y">
            {paginatedFiles.map((file, index) => {
              const fileId = startIndex + index
              const isSelected = selectedFiles.has(fileId)

              return (
                <TableRow
                  key={fileId}
                  className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'
                    }`}
                  onClick={() => handleRowClick(index)}
                >
                  <TableCell className="!p-4">
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleCheckboxClick(e, index)}
                    />
                  </TableCell>
                  {
                    showDuplicateInfo && (
                      <TableCell>
                        {
                          file.isOriginal ?
                          <Badge color="success" size="xs" className="w-fit">원본</Badge> :
                          <Badge color="failure" size="xs" className="w-fit">중복</Badge>
                        }
                      </TableCell>
                    )
                  }
                  <TableCell className="font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getFileIcon(file.extension)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate max-w-xs">
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
                    <Badge
                      color={getCategoryColor(file.extension)}
                      className="text-xs w-fit"
                    >
                      {file.extension || 'None'}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {startIndex + 1} - {Math.min(startIndex + pageSize, sortedFiles.length)} of {sortedFiles.length}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              color="gray"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              처음
            </Button>
            <Button
              size="sm"
              color="gray"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              이전
            </Button>

            <span className="px-3 py-1 text-sm bg-gray-100 rounded">
              {currentPage} / {totalPages}
            </span>

            <Button
              size="sm"
              color="gray"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              다음
            </Button>
            <Button
              size="sm"
              color="gray"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              마지막
            </Button>
          </div>
        </div>
      )}

      {/* 선택된 파일 액션 */}
      {selectedFiles.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm">
            <span className="font-medium text-blue-900">
              {selectedFiles.size}개 파일 선택됨
            </span>
            <span className="text-blue-700 ml-2">
              (총 {formatFileSize(getTotalSize())})
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              color="blue"
              onClick={() => {
                // TODO: 선택된 파일들만 정리
                console.log('선택된 파일들 정리:', Array.from(selectedFiles).map(i => sortedFiles[i]))
              }}
            >
              선택된 파일 정리
            </Button>
            <Button
              size="sm"
              color="gray"
              onClick={() => setSelectedFiles(new Set())}
            >
              선택 해제
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedFileTable