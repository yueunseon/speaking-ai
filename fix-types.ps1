# SvelteKit 타입 파일 권한 문제 해결 스크립트
# PowerShell에서 실행: .\fix-types.ps1

Write-Host "SvelteKit 타입 파일 문제 해결 중..." -ForegroundColor Yellow

# 1. Node 프로세스 종료
Write-Host "`n1. 실행 중인 Node 프로세스 확인 중..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   발견된 Node 프로세스: $($nodeProcesses.Count)개" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "   - PID: $($_.Id), 경로: $($_.Path)" -ForegroundColor Gray
    }
    Write-Host "   Node 프로세스를 종료하려면 수동으로 종료하세요." -ForegroundColor Yellow
} else {
    Write-Host "   실행 중인 Node 프로세스 없음" -ForegroundColor Green
}

# 2. .svelte-kit 폴더 삭제
Write-Host "`n2. .svelte-kit 폴더 삭제 중..." -ForegroundColor Cyan
if (Test-Path ".svelte-kit") {
    try {
        Remove-Item -Path ".svelte-kit" -Recurse -Force -ErrorAction Stop
        Write-Host "   .svelte-kit 폴더 삭제 완료" -ForegroundColor Green
    } catch {
        Write-Host "   삭제 실패: $_" -ForegroundColor Red
        Write-Host "   수동으로 삭제해주세요: .svelte-kit 폴더" -ForegroundColor Yellow
    }
} else {
    Write-Host "   .svelte-kit 폴더가 없습니다" -ForegroundColor Green
}

# 3. node_modules/.vite 폴더 삭제 (선택사항)
Write-Host "`n3. node_modules/.vite 캐시 삭제 중..." -ForegroundColor Cyan
if (Test-Path "node_modules\.vite") {
    try {
        Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction Stop
        Write-Host "   Vite 캐시 삭제 완료" -ForegroundColor Green
    } catch {
        Write-Host "   Vite 캐시 삭제 실패 (무시 가능)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Vite 캐시 없음" -ForegroundColor Green
}

# 4. svelte-kit sync 실행
Write-Host "`n4. SvelteKit 타입 동기화 중..." -ForegroundColor Cyan
try {
    npm run prepare
    Write-Host "   타입 동기화 완료" -ForegroundColor Green
} catch {
    Write-Host "   타입 동기화 실패: $_" -ForegroundColor Red
    Write-Host "   수동으로 실행: npm run prepare" -ForegroundColor Yellow
}

Write-Host "`n완료! 이제 'npm run dev'를 실행해보세요." -ForegroundColor Green
