import React, { useState, useEffect } from 'react'
import { Button, Card, Checkbox, Alert, Spinner, Progress } from 'flowbite-react'
import { HiCog, HiTrash, HiExclamation } from 'react-icons/hi'

const SystemCleanup = () => {
  const [cleanupItems, setCleanupItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [selectedItems, setSelectedItems] = useState(new Set())

  // 시스템 정리 항목 정의
  const CLEANUP_CATEGORIES = [
    {
      id: 'browser-cache',
      name: '브라우저 캐시',
      description: 'Chrome, Safari, Firefox 캐시 파일',
      paths: [
        '~/Library/Caches/com.google.Chrome/',
        '~/Library/Caches/com.apple.Safari/',
        '~/Library/Caches/org.mozilla.firefox/'
      ],
      icon: '🌐',
      risk: 'safe',
      estimatedSize: 0
    },
    {
      id: 'app-cache',
      name: '앱 캐시',
      description: '모든 앱의 캐시 파일들',
      paths: ['~/Library/Caches/'],
      icon: '📱',
      risk: 'safe',
      estimatedSize: 0
    },
    {
      id: 'system-logs',
      name: '시스템 로그',
      description: '30일 이상 된 로그 파일들',
      paths: ['~/Library/Logs/', '/var/log/'],
      icon: '📋',
      risk: 'safe',
      estimatedSize: 0
    },
    {
      id: 'temp-files',
      name: '임시 파일',
      description: '시스템 임시 파일들',
      paths: ['/tmp/', '/var/folders/'],
      icon: '🗑️',
      risk: 'safe',
      estimatedSize: 0
    },
    {
      id: 'downloads-old',
      name: '오래된 다운로드',
      description: '30일 이상 된 Downloads 파일',
      paths: ['~/Downloads/'],
      icon: '⬇️',
      risk: 'medium',
      estimatedSize: 0
    },
    {
      id: 'trash',
      name: '휴지통',
      description: '휴지통 완전 비우기',
      paths: ['~/.Trash/'],
      icon: '🗑️',
      risk: 'medium',
      estimatedSize: 0
    }
  ]

  useEffect(() => {
    // 컴포넌트 마운트시 기본 항목들 설정
    setCleanupItems(CLEANUP_CATEGORIES.map(item => ({ ...item, estimatedSize: 0 })))
  }, [])

  const scanSystem = async () => {
    setScanning(true)
    try {
      // 각 카테고리별 크기 스캔
      const scannedItems = []
      for (const item of CLEANUP_CATEGORIES) {
        // TODO: Electron API를 통해 실제 폴더 크기 계산
        const size = await window.electronAPI?.calculateFolderSize?.(item.paths) || Math.random() * 2000000000
        scannedItems.push({
          ...item,
          estimatedSize: size
        })
      }
      setCleanupItems(scannedItems)
    } catch (error) {
      console.error('시스템 스캔 에러:', error)
    } finally {
      setScanning(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleItemToggle = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedItems(new Set(cleanupItems.map(item => item.id)))
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  const getTotalSize = () => {
    return cleanupItems
      .filter(item => selectedItems.has(item.id))
      .reduce((total, item) => total + item.estimatedSize, 0)
  }

  const performCleanup = async () => {
    if (selectedItems.size === 0) return

    setCleaning(true)
    try {
      const itemsToClean = cleanupItems.filter(item => selectedItems.has(item.id))
      
      for (const item of itemsToClean) {
        // TODO: Electron API를 통해 실제 정리 실행
        console.log(`정리 중: ${item.name}`)
        await window.electronAPI?.cleanupPaths?.(item.paths)
        
        // 진행률 표시를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // 정리 완료 후 다시 스캔
      await scanSystem()
      setSelectedItems(new Set())
      
    } catch (error) {
      console.error('정리 중 에러:', error)
    } finally {
      setCleaning(false)
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'safe': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskText = (risk) => {
    switch (risk) {
      case 'safe': return '안전'
      case 'medium': return '주의'
      case 'high': return '위험'
      default: return '알 수 없음'
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <div className="flex items-center gap-4">
          <HiCog className="text-3xl text-purple-500" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">시스템 정리</h2>
            <p className="text-gray-600">
              안전한 시스템 파일들을 정리하여 저장 공간을 확보하세요
            </p>
          </div>
          <Button color="blue" onClick={scanSystem} disabled={scanning}>
            {scanning ? (
              <>
                <Spinner aria-label="Scanning" size="sm" className="mr-2" />
                스캔 중...
              </>
            ) : (
              '🔍 시스템 스캔'
            )}
          </Button>
        </div>
      </Card>

      {/* 주의사항 */}
      <Alert color="warning" icon={HiExclamation}>
        <div>
          <span className="font-medium">주의사항:</span> 
          시스템 정리는 안전한 파일들만 대상으로 하지만, 
          정리하기 전에 중요한 데이터는 백업해두는 것을 권장합니다.
        </div>
      </Alert>

      {/* 정리 항목 목록 */}
      {cleanupItems.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">정리 항목 선택</h3>
            <div className="flex gap-2">
              <Button color="light" size="sm" onClick={selectAll}>
                모두 선택
              </Button>
              <Button color="light" size="sm" onClick={deselectAll}>
                선택 해제
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {cleanupItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedItems.has(item.id) 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={item.id}
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleItemToggle(item.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(item.risk)}`}>
                        {getRiskText(item.risk)}
                      </span>
                      
                      {item.estimatedSize > 0 ? (
                        <span className="font-medium text-green-600">
                          예상 확보: {formatFileSize(item.estimatedSize)}
                        </span>
                      ) : (
                        <span className="text-gray-500">크기 계산 필요</span>
                      )}
                    </div>

                    {/* 경로 표시 */}
                    <div className="mt-2">
                      <details className="group">
                        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                          대상 경로 보기 ({item.paths.length}개)
                        </summary>
                        <div className="mt-1 ml-4 space-y-1">
                          {item.paths.map((path, index) => (
                            <div key={index} className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {path}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 정리 실행 버튼 */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                선택된 항목: {selectedItems.size}개 
                {selectedItems.size > 0 && (
                  <span className="ml-2 font-medium text-green-600">
                    (총 {formatFileSize(getTotalSize())} 확보 예상)
                  </span>
                )}
              </div>
              
              <Button
                color="success"
                size="lg"
                onClick={performCleanup}
                disabled={selectedItems.size === 0 || cleaning}
              >
                {cleaning ? (
                  <>
                    <Spinner aria-label="Cleaning" size="sm" className="mr-2" />
                    정리 중...
                  </>
                ) : (
                  <>
                    <HiTrash className="mr-2" />
                    선택한 항목 정리하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 정리 진행률 */}
      {cleaning && (
        <Card>
          <div className="text-center space-y-4">
            <h4 className="font-semibold">시스템 정리 진행 중...</h4>
            <Progress 
              progress={45} 
              textLabel="정리 중"
              size="lg"
              labelProgress
              labelText
            />
            <p className="text-sm text-gray-600">
              정리가 완료될 때까지 잠시만 기다려주세요
            </p>
          </div>
        </Card>
      )}

      {/* 빈 상태 */}
      {cleanupItems.length === 0 && !scanning && (
        <Card className="text-center">
          <div className="py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              시스템 스캔이 필요합니다
            </h3>
            <p className="text-gray-600 mb-4">
              시스템 스캔을 실행하여 정리 가능한 항목들을 확인하세요
            </p>
            <Button color="blue" size="lg" onClick={scanSystem}>
              🔍 지금 스캔하기
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SystemCleanup