# 🗂️ 파일 정리 앱

macOS용 스마트 파일 정리 도구

## ✨ 주요 기능

### 🎯 핵심 기능
- **📁 폴더 선택**: 정리할 폴더를 쉽게 선택
- **📄 파일 스캔**: 선택한 폴더의 모든 파일 분석
- **🗂️ 스마트 분류**: 파일 종류에 따른 자동 분류
- **🚀 원클릭 정리**: 한 번의 클릭으로 모든 파일 정리
- **파일명/확장자명 검색**: 파일명 혹은 특정 확장자 검색

### 🧹 시스템 정리 모드
- **안전 항목 선택**: 미리 정의된 안전한 정리 항목들 중 선택
- **시스템 스캔**: 캐시, 로그, 임시파일 등 분석
- **용량 미리보기**: 각 항목별 확보 가능한 용량 표시
- **선택 정리**: 체크한 항목들만 안전하게 정리

### 📂 정리 규칙
- **확장자별 분류**: 이미지, 문서, 동영상, 음악 등
- **날짜별 분류**: 생성일 또는 수정일 기준
- **크기별 분류**: 대용량 파일 별도 관리

### 🔍 고급 기능 (예정)
- **중복 파일 탐지**: 동일한 파일 찾기 및 정리
- **사용자 정의 규칙**: 개인화된 정리 방식
- **통계 대시보드**: 폴더 분석 및 리포트
- **실행 취소**: 정리 작업 되돌리기

## 🛠️ 기술 스택

- **Frontend**: React 19
- **Desktop**: Electron 26
- **Build Tool**: Vite 4
- **Package Manager**: npm

## 🚀 개발 환경 설정

### 사전 요구사항
- Node.js 20+
- macOS (권장)

### 설치 및 실행
```bash
# 저장소 클론
git clone https://github.com/finnn6/file-organizer.git
cd file-organizer

# 의존성 설치
npm install

# 개발 모드 실행
npm run dev
```

### 빌드
```bash
# 렌더러 빌드
npm run build:renderer

# 앱 빌드 (예정)
npm run build
```

## 📁 프로젝트 구조

```
file-organizer/
├── src/
│   ├── main/              # Electron 메인 프로세스
│   │   └── main.cjs       # 앱 진입점
│   └── renderer/          # React 렌더러 프로세스
│       ├── components/    # React 컴포넌트
│       ├── hooks/         # 커스텀 훅
│       ├── utils/         # 유틸리티 함수
│       ├── App.jsx        # 메인 React 컴포넌트
│       └── main.jsx       # React 진입점
├── public/                # 정적 파일
├── dist-renderer/         # 빌드 결과물
├── vite.config.js         # Vite 설정
└── package.json           # 프로젝트 설정
```

## 🎯 로드맵

### ✅ Phase 1: 기본 기능 (현재)
- [x] 프로젝트 초기 설정
- [x] Electron + React 환경 구성
- [ ] 폴더 선택 기능
- [ ] 파일 목록 표시
- [ ] 기본 UI 구성

### 🔄 Phase 2: 정리 기능
- [ ] 확장자별 파일 분류
- [ ] 날짜별 파일 분류
- [ ] 폴더 생성 및 파일 이동
- [ ] 정리 결과 표시

### 🌟 Phase 3: 고급 기능
- [ ] 중복 파일 탐지
- [ ] 사용자 정의 규칙
- [ ] 통계 및 분석
- [ ] 실행 취소 기능

### 🚀 Phase 4: 배포
- [ ] 앱 아이콘 및 브랜딩
- [ ] 자동 업데이트
- [ ] macOS 공증
- [ ] 배포 자동화

## 📄 라이선스

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 링크

- [GitHub Repository](https://github.com/finnn6/file-organizer)
- [Issues](https://github.com/finnn6/file-organizer/issues)

---

**Made with ❤️ by finnn6**