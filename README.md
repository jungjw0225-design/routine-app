# 루틴 트래커 — 설치 가이드

Google 계정으로 로그인하면 기기 간 루틴 데이터가 실시간으로 동기화됩니다.  
Firebase Realtime Database + Google 인증을 사용합니다.

---

## 1단계: Firebase 프로젝트 생성

1. https://console.firebase.google.com 접속
2. "프로젝트 추가" 클릭 → 이름 입력 → 생성
3. 좌측 메뉴 "빌드" → "Realtime Database" → "데이터베이스 만들기"
4. **테스트 모드**로 시작 → 위치 선택(asia-southeast1 권장) 후 완료

---

## 2단계: Google 로그인 활성화

1. 좌측 메뉴 "빌드" → "Authentication" → "시작하기"
2. "Sign-in method" 탭 → "Google" 클릭 → 활성화 → 저장

---

## 3단계: Firebase Security Rules 설정

Realtime Database → "규칙" 탭에서 아래로 교체 후 게시:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

---

## 4단계: config.js 설정

1. Firebase 콘솔 → 프로젝트 설정(톱니바퀴 아이콘) → "내 앱" 섹션
2. 웹앱 추가(`</>` 아이콘) → 앱 닉네임 입력 후 등록
3. 표시되는 `firebaseConfig` 값을 복사해서 `config.js` 파일에 붙여넣기

```js
// config.js 예시
export const FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "my-project.firebaseapp.com",
  databaseURL: "https://my-project-default-rtdb.firebaseio.com",
  projectId: "my-project",
  storageBucket: "my-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## 5단계: GitHub Pages 배포

1. GitHub에서 새 저장소 생성 (public)
2. 이 폴더의 파일들을 push

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/[username]/[repo-name].git
git push -u origin main
```

3. 저장소 Settings → Pages → Source: `main` 브랜치 → Save
4. 2~3분 후 `https://[username].github.io/[repo-name]` 접속

> **중요**: Firebase 콘솔 → Authentication → 승인된 도메인에  
> `[username].github.io` 추가 필요 (없으면 로그인 팝업이 차단될 수 있음)

---

## 6단계: 아이폰 Safari 홈화면 추가

1. Safari에서 앱 URL 열기
2. 하단 공유 버튼(네모+화살표) 탭
3. "홈 화면에 추가" 탭
4. 이름 확인 후 "추가"

---

## PC / 맥북 설치

Chrome에서 주소창 우측 설치 아이콘 클릭 → "설치"

---

## 데이터 구조 (Firebase Realtime Database)

```
users/{uid}/
  routines/{routineId}   — 루틴 정보 (name, category, repeat_type, ...)
  completions/{date}/{routineId}  — 완료 기록 (true/false)
  categories/{catId}     — 카테고리 (name, icon, color, sort_order)
  settings/day_end_hour  — 하루 마감 시간 (0~6)
```
