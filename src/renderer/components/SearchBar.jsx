import React, { useState, useEffect } from 'react'
import { TextInput, Button, Checkbox, Card, Badge } from 'flowbite-react'
import { HiSearch, HiChevronDown, HiChevronUp, HiX, HiPencil, HiCheck } from 'react-icons/hi'

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchMode, setSearchMode] = useState('OR') // 'OR' 또는 'AND'
  const [activeFilters, setActiveFilters] = useState([]) // 선택된 필터들
  const [filters, setFilters] = useState({
    fileName: true,
    extension: true,
    size: true,
    date: true
  })

  // 수정 가능한 빠른 검색 항목들
  const [quickSearchItems, setQuickSearchItems] = useState([
    { id: 1, label: '임시파일', query: '*.tmp', editable: false },
    { id: 2, label: '대용량', query: '>100MB', editable: false },
    { id: 3, label: '30일이상', query: 'older:30days', editable: true },
    { id: 4, label: '.DS_Store', query: '.DS_Store', editable: true }
  ])

  const [editingItem, setEditingItem] = useState(null)
  const [editValue, setEditValue] = useState('')

  // 실시간 검색 - query나 filters가 바뀔 때마다 자동 검색
  useEffect(() => {
    // activeFilters와 searchMode도 포함해서 검색
    onSearch(query, filters, activeFilters, searchMode)
  }, [query, filters, activeFilters, searchMode, onSearch])

  const handleFilterChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }))
  }

  const clearSearch = () => {
    setQuery('')
  }

  const startEditing = (item) => {
    setEditingItem(item.id)
    setEditValue(item.query)
  }

  const handleQuickSearchClick = (item) => {
    // 이미 선택된 필터인지 확인
    const isActive = activeFilters.some(filter => filter.query === item.query)
    
    if (isActive) {
      // 이미 선택된 경우 제거
      setActiveFilters(prev => prev.filter(filter => filter.query !== item.query))
    } else {
      // 새로 추가
      setActiveFilters(prev => [...prev, { query: item.query, label: item.label }])
    }
  }

  const generateLabel = (query, originalLabel) => {
    // 날짜 관련 쿼리 파싱 (older:10days -> "10일이상")
    const dateMatch = query.match(/^older:(\d+)(days?|weeks?|months?)$/i)
    if (dateMatch) {
      const [, value, unit] = dateMatch
      const unitMap = {
        'day': '일',
        'days': '일',
        'week': '주',
        'weeks': '주', 
        'month': '개월',
        'months': '개월'
      }
      return `${value}${unitMap[unit.toLowerCase()]}이상`
    }
    
    // .DS_Store 등 파일명은 그대로
    if (query.startsWith('.')) {
      return query
    }
    
    // 기본적으로는 원래 라벨 유지
    return originalLabel
  }

  const saveEdit = (itemId) => {
    const originalItem = quickSearchItems.find(item => item.id === itemId)
    const newLabel = generateLabel(editValue, originalItem.label)
    
    setQuickSearchItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, query: editValue, label: newLabel }
          : item
      )
    )
    setEditingItem(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditValue('')
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <TextInput
            icon={HiSearch}
            placeholder="실시간 검색: 파일명, 확장자, 크기, 날짜... (예: photoshop, *.jpg, >100MB, older:30days)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sizing="md"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <HiX className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          color="light"
          size="md"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <HiChevronUp /> : <HiChevronDown />}
        </Button>
      </div>

      {/* 빠른 필터 버튼들과 검색 모드 선택 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-600">빠른 검색:</span>
        
        {quickSearchItems.map(item => {
          const isActive = activeFilters.some(filter => filter.query === item.query)
          
          return (
            <div key={item.id}>
              {editingItem === item.id ? (
                <div className="flex items-center gap-1">
                  <TextInput
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    size="sm"
                    className="w-28"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') saveEdit(item.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    autoFocus
                  />
                  <Button
                    size="xs"
                    color="success"
                    onClick={() => saveEdit(item.id)}
                    className="p-1"
                  >
                    <HiCheck className="h-3 w-3" />
                  </Button>
                  <Button
                    size="xs"
                    color="failure"
                    onClick={cancelEdit}
                    className="p-1"
                  >
                    <HiX className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                // 일반 모드
                <Button
                  size="xs"
                  color={isActive ? "blue" : "light"}
                  onClick={() => handleQuickSearchClick(item)}
                  onDoubleClick={item.editable ? () => startEditing(item) : undefined}
                  className={`${item.editable ? "border-dashed" : ""} ${isActive ? "ring-2 ring-blue-300" : ""}`}
                  title={item.editable ? "더블클릭하여 수정" : "클릭하여 필터 추가/제거"}
                >
                  {item.label}
                  {isActive && <span className="ml-1">✓</span>}
                </Button>
              )}
            </div>
          )
        })}

        {/* 선택된 필터들 표시 */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-500">활성 필터:</span>
            {activeFilters.map((filter, index) => (
              <Badge key={index} color="blue" size="sm">
                {filter.label}
                <button
                  onClick={() => setActiveFilters(prev => prev.filter((_, i) => i !== index))}
                  className="ml-1 text-blue-300 hover:text-blue-100"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* 현재 검색 상태 표시 */}
        {query && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-500">텍스트 검색:</span>
            <Badge color="info" size="sm">
              "{query}"
            </Badge>
          </div>
        )}
      </div>

      {/* 고급 옵션 */}
      {showAdvanced && (
        <Card className="bg-gray-50">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">검색 옵션</h4>

            <div className="grid grid-cols-4 gap-3">
              <div className="flex items-center">
                <Checkbox
                  id="fileName"
                  checked={filters.fileName}
                  onChange={() => handleFilterChange('fileName')}
                />
                <label htmlFor="fileName" className="ml-2 text-sm text-gray-900">
                  파일명
                </label>
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="extension"
                  checked={filters.extension}
                  onChange={() => handleFilterChange('extension')}
                />
                <label htmlFor="extension" className="ml-2 text-sm text-gray-900">
                  확장자
                </label>
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="size"
                  checked={filters.size}
                  onChange={() => handleFilterChange('size')}
                />
                <label htmlFor="size" className="ml-2 text-sm text-gray-900">
                  크기
                </label>
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="date"
                  checked={filters.date}
                  onChange={() => handleFilterChange('date')}
                />
                <label htmlFor="date" className="ml-2 text-sm text-gray-900">
                  날짜
                </label>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded">
              <div className="text-xs text-blue-800 grid grid-cols-2 gap-1">
                <div><code>photoshop</code> - 파일명 포함</div>
                <div><code>*.jpg</code> - 확장자 매칭</div>
                <div><code>&gt;100MB</code> - 크기 이상</div>
                <div><code>older:30days</code> - 날짜 이전</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SearchBar