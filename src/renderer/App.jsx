import React, { useState } from 'react'
import { Card, Tabs } from 'flowbite-react'
import { HiFolder, HiCog } from 'react-icons/hi'
import FolderCleanup from './components/FolderCleanup'
import SystemCleanup from './components/SystemCleanup'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('folder')

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          🗂️ 파일 정리 도구
        </h1>
        <p className="text-lg text-gray-600">
          개인 파일 정리부터 시스템 찌꺼기 정리까지 한번에!
        </p>
      </div>
      
      <Card className="shadow-lg">
        <Tabs
          aria-label="정리 모드 선택"
          variant="underline"
          onActiveTabChange={(tab) => setActiveTab(['folder', 'system'][tab])}
        >
          <Tabs.Item 
            title="폴더 정리" 
            icon={HiFolder}
          >
            <FolderCleanup />
          </Tabs.Item>
          
          <Tabs.Item 
            title="시스템 정리" 
            icon={HiCog}
          >
            <SystemCleanup />
          </Tabs.Item>
        </Tabs>
      </Card>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>⚠️ 시스템 정리는 안전한 파일들만 정리합니다</p>
      </div>
    </div>
  )
}

export default App