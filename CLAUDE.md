# 루틴 트래커 — 작업 컨텍스트

Google 로그인 기반 습관/루틴 추적 PWA. 바닐라 JS 단일 파일 구조.

## 배포

- 저장소: `jungjw0225-design/routine-app`
- 사이트: https://jungjw0225-design.github.io/routine-app
- **GitHub Pages는 `main` 브랜치에서 배포됨.** push 후 2~3분이면 자동 반영.
- 작업 브랜치에만 푸시하면 사이트에 반영되지 않음 — 배포하려면 `main`에 들어가야 함.

### 작업 흐름 (저장소 소유자 승인 완료)

**이 저장소는 PR 검토 단계를 두지 않는다. 작업한 내용은 `main`에 직접 푸시한다.**
1인 개발 저장소이고 CI가 없어 PR이 실질적인 검증을 제공하지 않으므로, 소유자가
직접 푸시 방식을 승인했다. 매번 다시 물어보지 말 것.

대신 아래 검증을 푸시 전에 수행한다.

- `index.html` / `sw.js` / `config.js` 를 수정했으면 **헤들리스 브라우저로 실제 로드 검증**을 거친다.
  로컬 정적 서버로 띄우고 Chromium(`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`,
  `playwright-core`)으로 접속해 `pageerror` / console error / 화면 전환 상태를 확인한다.
  단일 파일 구조라 문법 오류 하나가 곧바로 흰 화면이 되므로, diff 검토만으로는 부족하다.
- **Firebase 데이터 구조를 바꾸는 변경은 예외** — 코드는 `git revert`로 되돌려도 이미
  변형된 사용자 데이터는 복구되지 않는다. 이런 변경은 진행 전에 반드시 소유자에게 알린다.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 마크업 + CSS + 앱 로직 전부 (단일 파일) |
| `config.js` | Firebase 설정값 (웹 클라이언트 config, 공개되어도 무방) |
| `manifest.json` | PWA 매니페스트 |
| `sw.js` | 서비스 워커 (HTML=network-first, 에셋=stale-while-revalidate) |
| `icon.png` | 앱 아이콘 (R) |

`index.html` / `manifest.json` / `sw.js`는 배포 시 함께 푸시할 것.

## Firebase

- 프로젝트: `routine-566ba` — Realtime Database (asia-southeast1), Google 로그인
- 데이터 구조:

```
users/{uid}/
  routines/{routineId}            루틴 (name, category, repeat_type, ...)
  completions/{date}/{routineId}  완료 기록 (true/false)
  categories/{catId}              카테고리 (name, icon, color, sort_order)
  settings/day_end_hour           하루 마감 시간 (0~6)
```

- 보안 규칙은 `$uid === auth.uid` 로 본인 데이터만 읽기/쓰기 허용.
- Authentication → 승인된 도메인에 `jungjw0225-design.github.io` 가 있어야 로그인 팝업이 작동함.

## 주의사항

- **서비스 워커 캐시**: `sw.js`의 `CACHE_NAME`(현재 `routine-cache-v1`)이 에셋을 캐싱함.
  아이콘이나 정적 자산을 교체하면 **반드시 버전을 올려야** 사용자에게 반영됨.
- **iOS 홈화면 아이콘**: 홈화면에 추가한 시점의 아이콘으로 고정됨(iOS 제약).
  아이콘을 바꿔도 기존 사용자에게 자동 반영되지 않음 — 삭제 후 재추가해야 함.
- 쓰기 동작은 `requireAuth()` 가드를 거침. 새 쓰기 경로를 추가하면 가드도 같이 붙일 것.

## 구현된 기능

- 탭 4개: 오늘 / 대시보드(링 차트·연속일수·주간바·Top5) / 캘린더 / 관리(루틴·카테고리·휴지통)
- `day_end_hour` 기반 날짜 계산 — 새벽 시간대에는 전날로 취급
- 하루 마감하기, 날짜 선택기
- 즉시 실행: `localStorage`의 `routine_cache`로 낙관적 렌더 후 Firebase 데이터로 교체
- 포그라운드 자동 새로고침: 복귀 시 `renderAll()`, 30분 이상 백그라운드였으면 `location.reload()`
- 검색엔진 노출 차단 (noindex 메타)

## 아이콘 제작 규칙

Nunito ExtraBold 한 글자, 픽셀 스캔으로 중앙 정렬(잉크가 높이의 약 45%), 앱 테마색 사용.
루틴 트래커는 보라 배경 `#7C6AF7` + 흰 글자 `R`.

## 작업 방식

- 코드 변경은 product-manager → implementer → reviewer(+ 양식·심미 검토) 순서로 진행.
- 대화 말투는 해요체.

## 관련 프로젝트

같은 계정의 자매 PWA — 구조와 규칙이 동일함.

- `jungjw0225-design/calisthenics-tracker` — Firebase `calisthenics-4e2f9`, 아이콘 `C` (보라/흰)
- `jungjw0225-design/response-shift` — 아이콘 `U` (다크/라임)
