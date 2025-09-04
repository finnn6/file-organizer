import React, { useCallback, useState } from 'react'
import { Button, Card, Alert, Spinner } from 'flowbite-react'
import { HiFolder, HiSearch } from 'react-icons/hi'
import SearchBar from './SearchBar'
import AdvancedFileTable from './AdvancedFileTable'

const FolderCleanup = () => {
  const [selectedFolder, setSelectedFolder] = useState('')
  const [files, setFiles] = useState([])
  const [filteredFiles, setFilteredFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelectFolder = async () => {
    try {
      const folderPath = await window.electronAPI?.selectFolder()
      if (folderPath) {
        setSelectedFolder(folderPath)

        // 파일 목록 가져오기
        setLoading(true)
        const fileList = await window.electronAPI.getFiles(folderPath)
        setFiles(fileList)
        setFilteredFiles(fileList)
        setLoading(false)
        setSearchQuery('') // 검색 초기화
      }
    } catch (error) {
      console.error('폴더 선택 에러:', error)
      setLoading(false)
    }
  }

  const handleSearch = useCallback((query, filters, activeFilters = [], searchMode = 'OR') => {
    setSearchQuery(query)

    // 텍스트 검색이 없고 활성 필터도 없으면 모든 파일 표시
    if (!query.trim() && activeFilters.length === 0) {
      setFilteredFiles(files)
      return
    }

    const filtered = files.filter(file => {
      let textMatches = false
      let filterMatches = false

      // 텍스트 검색 처리
      if (query.trim()) {
        const matchesName = filters.fileName && 
          file.name.toLowerCase().includes(query.toLowerCase())
        const matchesExtension = filters.extension && checkExtensionFilter(file, query)
        const matchesSize = filters.size && checkSizeFilter(file.size, query)
        const matchesDate = filters.date && checkDateFilter(file.modified, query)
        
        textMatches = matchesName || matchesExtension || matchesSize || matchesDate
      }

      // 활성 필터 처리
      if (activeFilters.length > 0) {
        const filterResults = activeFilters.map(filter => {
          const matchesName = filters.fileName && 
            file.name.toLowerCase().includes(filter.query.toLowerCase())
          const matchesExtension = filters.extension && checkExtensionFilter(file, filter.query)
          const matchesSize = filters.size && checkSizeFilter(file.size, filter.query)
          const matchesDate = filters.date && checkDateFilter(file.modified, filter.query)
          
          return matchesName || matchesExtension || matchesSize || matchesDate
        })

        if (searchMode === 'AND') {
          filterMatches = filterResults.every(result => result) // 모든 조건 만족
        } else {
          filterMatches = filterResults.some(result => result) // 하나라도 만족
        }
      }

      // 텍스트 검색과 필터 검색 결과 결합
      if (query.trim() && activeFilters.length > 0) {
        return textMatches || filterMatches // 텍스트 검색 OR 필터 검색
      } else if (query.trim()) {
        return textMatches
      } else if (activeFilters.length > 0) {
        return filterMatches
      }

      return false
    })

    setFilteredFiles(filtered)
  }, [files])

  const checkExtensionFilter = (file, query) => {
    // 기존 확장자 검색 로직 유지 (이미 잘 작동함)
    return file.extension?.toLowerCase().includes(query.toLowerCase()) ||
           file.name.toLowerCase().includes(query.toLowerCase())
  }

  const checkSizeFilter = (fileSize, query) => {
    // 크기 필터 로직 (">100MB", "<1KB", ">=50MB" 등)
    const sizeMatch = query.match(/^([<>]=?)\s*(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i)
    if (!sizeMatch) return false

    const [, operator, value, unit] = sizeMatch
    const multipliers = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 }
    const targetSize = parseFloat(value) * multipliers[unit.toUpperCase()]

    switch (operator) {
      case '>': return fileSize > targetSize
      case '>=': return fileSize >= targetSize
      case '<': return fileSize < targetSize
      case '<=': return fileSize <= targetSize
      default: return false
    }
  }

  const checkDateFilter = (fileDate, query) => {
    // 날짜 필터 로직 ("older:30days", "newer:1week", "older:2months" 등)
    const dateMatch = query.match(/^(older|newer):(\d+)(days?|weeks?|months?|years?)$/i)
    if (!dateMatch) return false

    const [, direction, value, unit] = dateMatch
    const now = new Date()
    const fileDateTime = new Date(fileDate)

    let milliseconds = 0
    const numValue = parseInt(value)
    
    switch (unit.toLowerCase()) {
      case 'day':
      case 'days':
        milliseconds = numValue * 24 * 60 * 60 * 1000
        break
      case 'week':
      case 'weeks':
        milliseconds = numValue * 7 * 24 * 60 * 60 * 1000
        break
      case 'month':
      case 'months':
        milliseconds = numValue * 30 * 24 * 60 * 60 * 1000
        break
      case 'year':
      case 'years':
        milliseconds = numValue * 365 * 24 * 60 * 60 * 1000
        break
      default:
        return false
    }

    const diffTime = now.getTime() - fileDateTime.getTime()
    if (direction === 'older') {
      return diffTime > milliseconds
    } else {
      return diffTime < milliseconds
    }
  }

  const handleOrganize = () => {
    // TODO: 파일 정리 로직 구현
    console.log('정리할 파일들:', filteredFiles)
  }

  return (
    <div className="space-y-6">
      {/* 폴더 선택 섹션 */}
      <Card>
        <div className="flex items-center gap-4">
          <HiFolder className="text-3xl text-blue-500" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">1. 폴더 선택</h2>
            <Button onClick={handleSelectFolder} color="blue" size="lg">
              📁 폴더 선택하기
            </Button>
          </div>
        </div>

        {selectedFolder && (
          <Alert color="info" className="mt-4">
            <div>
              <span className="font-medium">선택된 폴더:</span>
              <div className="mt-1 font-mono text-sm break-all bg-gray-100 p-2 rounded">
                {selectedFolder}
              </div>
            </div>
          </Alert>
        )}
      </Card>

      {/* 검색 섹션 - 파일이 있을 때만 표시하고 파일 목록 카드 안에 포함 */}
      {loading && (
        <Card className="text-center">
          <div className="flex items-center justify-center gap-3 py-8">
            <Spinner aria-label="Loading" size="md" />
            <span className="text-lg">파일 목록을 불러오는 중...</span>
          </div>
        </Card>
      )}

      {/* 파일 목록 */}
      {files.length > 0 && !loading && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              3. 파일 목록
              {searchQuery && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (검색: "{searchQuery}")
                </span>
              )}
            </h2>
            <div className="text-sm text-gray-600">
              총 {filteredFiles.length.toLocaleString()}개 파일
            </div>
          </div>

          {/* 검색바를 파일 목록 카드 안으로 이동 */}
          <div className="mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          <AdvancedFileTable files={filteredFiles} />

          <div className="mt-6 text-center">
            <Button
              color="success"
              size="lg"
              onClick={handleOrganize}
              disabled={filteredFiles.length === 0}
            >
              🚀 모든 파일 정리하기
            </Button>
          </div>
        </Card>
      )}

      {/* 빈 폴더 */}
      {selectedFolder && files.length === 0 && !loading && (
        <Card className="text-center">
          <div className="py-8">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              폴더가 비어있습니다
            </h3>
            <p className="text-gray-600">
              선택한 폴더에 정리할 파일이 없습니다.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default FolderCleanup