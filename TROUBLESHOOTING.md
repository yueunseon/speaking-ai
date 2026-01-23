# 문제 해결 가이드

## EPERM, Permission denied 오류 해결 방법

Windows에서 `.svelte-kit` 타입 파일 접근 권한 오류가 발생하는 경우:

### 방법 1: 자동 해결 스크립트 사용 (권장)

PowerShell에서 실행:

```powershell
.\fix-types.ps1
```

또는 npm 스크립트 사용:

```bash
npm run fix-types
```

### 방법 2: 수동 해결

#### 1단계: 모든 Node 프로세스 종료
- 작업 관리자(Ctrl + Shift + Esc) 열기
- "Node.js" 또는 "node" 프로세스 모두 종료
- 또는 PowerShell에서:
  ```powershell
  Get-Process -Name "node" | Stop-Process -Force
  ```

#### 2단계: .svelte-kit 폴더 삭제
PowerShell에서:
```powershell
Remove-Item -Path ".svelte-kit" -Recurse -Force
```

또는 명령 프롬프트에서:
```cmd
rmdir /s /q .svelte-kit
```

#### 3단계: 타입 재생성
```bash
npm run sync
```

또는:
```bash
npm run prepare
```

#### 4단계: 개발 서버 재시작
```bash
npm run dev
```

### 방법 3: 관리자 권한으로 실행

1. VS Code나 터미널을 관리자 권한으로 실행
2. 위의 방법 2를 다시 시도

### 방법 4: 완전 초기화

```bash
# 1. .svelte-kit 삭제
npm run clean:win

# 2. 타입 재생성
npm run sync

# 3. 개발 서버 시작
npm run dev
```

### 추가 팁

- **VS Code를 사용하는 경우**: VS Code를 완전히 종료한 후 다시 열기
- **Windows Defender**: 실시간 보호가 파일 접근을 차단할 수 있으므로, 프로젝트 폴더를 예외 목록에 추가
- **파일 탐색기**: `.svelte-kit` 폴더가 파일 탐색기에서 열려있으면 닫기

### 예방 방법

1. 개발 서버를 종료할 때는 `Ctrl + C`로 정상 종료
2. 타입 오류가 발생하면 즉시 해결 (무시하지 않기)
3. 정기적으로 `.svelte-kit` 폴더를 삭제하고 재생성
