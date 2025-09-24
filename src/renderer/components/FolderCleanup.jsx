import React, { useCallback, useState } from 'react'
import { Button, Card, Alert, Spinner, Badge } from 'flowbite-react'
import { HiFolder, HiSearch, HiDuplicate, HiTrash } from 'react-icons/hi'
import SearchBar from './SearchBar'
import AdvancedFileTable from './AdvancedFileTable'
import { formatBytes } from '../utils/fileHelpers'


const FolderCleanup = () => {
  const [selectedFolder, setSelectedFolder] = useState('')
  const [files, setFiles] = useState([])
  const [filteredFiles, setFilteredFiles] = useState([])
  const [duplicateFiles, setDuplicateFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showingDuplicates, setShowingDuplicates] = useState(false)

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
        setShowingDuplicates(false) // 중복 파일 모드 해제
        setDuplicateFiles([]) // 중복 파일 초기화
      }
    } catch (error) {
      console.error('폴더 선택 에러:', error)
      setLoading(false)
    }
  }

  // 중복 파일 탐색 함수
  const handleFindDuplicates = async () => {
    try {
      setDuplicateLoading(true)

      const result = await window.electronAPI?.findDuplicateFiles(selectedFolder)

      // 올바른 체크: result.duplicateFiles.length
      if (result && result.duplicateFiles && result.duplicateFiles.length > 0) {
        setDuplicateFiles(result.duplicateFiles)  // 파일 배열만
        setFilteredFiles(result.duplicateFiles)
        setShowingDuplicates(true)
        setSearchQuery('') // 검색 초기화

        console.log(`중복 파일 ${result.duplicateFiles.length}개 발견!`)
      } else {
        // 중복 파일이 없는 경우 알림
        alert('중복 파일이 발견되지 않았습니다.')
      }
    } catch (error) {
      console.error('중복 파일 탐색 에러:', error)
      alert('중복 파일 탐색 중 오류가 발생했습니다.')
    } finally {
      setDuplicateLoading(false)
    }
  }

  // 중복 파일 정리 함수
  const handleCleanDuplicates = async () => {
    if (duplicateFiles.length === 0) return

    const confirmClean = window.confirm(
      `${duplicateFiles.length}개의 중복 파일을 정리하시겠습니까?\n(원본을 제외한 중복본들이 삭제됩니다)`
    )

    if (confirmClean) {
      try {
        setLoading(true)
        await window.electronAPI?.cleanDuplicateFiles(duplicateFiles)

        // 파일 목록 다시 불러오기
        const fileList = await window.electronAPI.getFiles(selectedFolder)
        setFiles(fileList)
        setFilteredFiles(fileList)
        setDuplicateFiles([])
        setShowingDuplicates(false)

        alert('중복 파일 정리가 완료되었습니다.')
      } catch (error) {
        console.error('중복 파일 정리 에러:', error)
        alert('중복 파일 정리 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
  }

  // 전체 파일 보기로 돌아가기
  const handleShowAllFiles = () => {
    setShowingDuplicates(false)
    setFilteredFiles(files)
    setSearchQuery('')
  }

  const handleSearch = useCallback((query, filters, activeFilters = [], searchMode = 'OR') => {
    setSearchQuery(query)

    // 중복 파일 모드일 때는 중복 파일에서만 검색
    const sourceFiles = showingDuplicates ? duplicateFiles : files

    // 텍스트 검색이 없고 활성 필터도 없으면 모든 파일 표시
    if (!query.trim() && activeFilters.length === 0) {
      setFilteredFiles(sourceFiles)
      return
    }

    const filtered = sourceFiles.filter(file => {
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
          filterMatches = filterResults.every(result => result)
        } else {
          filterMatches = filterResults.some(result => result)
        }
      }

      // 텍스트 검색과 필터 검색 결과 결합
      if (query.trim() && activeFilters.length > 0) {
        return textMatches || filterMatches
      } else if (query.trim()) {
        return textMatches
      } else if (activeFilters.length > 0) {
        return filterMatches
      }

      return false
    })

    setFilteredFiles(filtered)
  }, [files, duplicateFiles, showingDuplicates])

  const checkExtensionFilter = (file, query) => {
    return file.extension?.toLowerCase().includes(query.toLowerCase()) ||
      file.name.toLowerCase().includes(query.toLowerCase())
  }

  const checkSizeFilter = (fileSize, query) => {
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
    console.log('정리할 파일들:', filteredFiles)
  }

  return (
    <div className="space-y-6">
      {/* 폴더 선택 섹션 */}
      <Card>
        <div className="flex items-center gap-4">
          <HiFolder className="text-3xl text-blue-500" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">폴더 선택</h2>
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

      {/* 중복 파일 관리 섹션 */}
      {selectedFolder && (
        <Card>
          <div className="flex items-center gap-4">
            <HiDuplicate className="text-3xl text-orange-500" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">중복 파일 관리</h2>
              <div className="flex gap-3">
                <Button
                  onClick={handleFindDuplicates}
                  color="warning"
                  size="lg"
                  disabled={duplicateLoading || loading}
                >
                  {duplicateLoading ? (
                    <>
                      <Spinner aria-label="Loading" size="sm" className="mr-2" />
                      탐색 중...
                    </>
                  ) : (
                    <>
                      🔍 중복 파일 탐색
                    </>
                  )}
                </Button>

                {duplicateFiles.length > 0 && (
                  <Button
                    onClick={handleCleanDuplicates}
                    color="failure"
                    size="lg"
                    disabled={duplicateLoading || loading}
                  >
                    🗑️ 중복 파일 정리
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* 중복 파일 통계 */}
          {duplicateFiles.length > 0 && (
            <Alert color="warning" className="mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">중복된 {duplicateFiles.length}개 파일 발견</span>
                </div>
              </div>
            </Alert>
          )}
        </Card>
      )}

      {/* 로딩 */}
      {loading && (
        <Card className="text-center">
          <div className="flex items-center justify-center gap-3 py-8">
            <Spinner aria-label="Loading" size="md" />
            <span className="text-lg">파일 목록을 불러오는 중...</span>
          </div>
        </Card>
      )}

      {/* ===================== 중복 파일 모드 ===================== */}
      {showingDuplicates && duplicateFiles.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              🔍 중복 파일 목록
              <Badge color="warning">
                중복 파일 {duplicateFiles.length}개
              </Badge>
              {searchQuery && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (검색: "{searchQuery}")
                </span>
              )}
            </h2>
          </div>

          {/* 중복 파일 안내 */}
          <Alert color="info" className="mb-6">
            <div className="text-sm">
              <p><strong>📋 중복 파일 정리 안내</strong></p>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li><Badge color="green" size="sm" className='w-fit inline mx-1'>원본</Badge>으로 표시된 파일은 보존됩니다.</li>
                <li><strong><Badge color="red" size="sm" className='w-fit inline mx-1'>중복</Badge>으로 표시된 파일만 삭제됩니다.</strong></li>
                <li>**더 나중에 수정되었고 해시값이 동일한 파일들만 중복으로 판정됩니다.**</li>
              </ul>
            </div>
          </Alert>

          {/* 검색바 */}
          <div className="mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* 중복 파일 테이블 (기존 AdvancedFileTable 사용하되 중복 정보 표시) */}
          <AdvancedFileTable files={filteredFiles} />

          <div className="mt-6 text-center">
            <div className="flex gap-3 justify-center">
              <Button
                color="failure"
                size="lg"
                onClick={handleCleanDuplicates}
                disabled={filteredFiles.filter(f => f.canDelete).length === 0}
              >
                🗑️ 중복 파일 정리 ({duplicateFiles.filter(f => f.canDelete).length}개 삭제)
              </Button>
              <Button
                color="gray"
                size="lg"
                onClick={handleShowAllFiles}
              >
                전체 파일 보기
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ===================== 일반 파일 목록 모드 ===================== */}
      {!showingDuplicates && files.length > 0 && !loading && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              📁 파일 목록
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

          {/* 검색바 */}
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