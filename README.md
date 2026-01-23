# Speaking AI - 영어회화 연습 서비스

OpenAI의 Audio API를 사용한 영어회화 연습 서비스입니다. 음성을 녹음하고 AI 튜터와 대화하며 영어 실력을 향상시킬 수 있습니다.

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv create --template minimal --no-types --add eslint vitest="usages:unit,component" tailwindcss="plugins:none" sveltekit-adapter="adapter:vercel" --install npm speaking-ai
```

## 환경 변수 설정

### 로컬 개발 환경

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 추가하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Vercel 배포 시

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

1. **Settings > Environment Variables**로 이동
2. 다음 변수들을 추가:
   - `OPENAI_API_KEY`: OpenAI API 키
   - `PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
   - `PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key

**참고**: 
- Site URL은 코드에서 자동으로 감지되므로 별도 환경 변수가 필요하지 않습니다. (`url.origin` 사용)
- 이메일 확인 링크의 리다이렉트 URL은 자동으로 현재 도메인을 사용합니다.
- Vercel은 자동으로 `VERCEL_URL` 환경 변수를 제공하지만, 현재 구현에서는 사용하지 않습니다.

- OpenAI API 키는 [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급받을 수 있습니다.
- Supabase 설정:
  1. [Supabase](https://supabase.com)에서 프로젝트를 생성하세요
  2. 프로젝트 설정 > API에서 URL과 anon key를 확인하세요
  3. Authentication > Settings에서 이메일 인증을 활성화하세요
  4. **Authentication > URL Configuration**에서 Redirect URLs 설정 (중요!):
     - **Site URL**: 프로덕션 URL 설정
       - 예: `https://speaking-ai-five.vercel.app` (Vercel 배포 시)
       - ⚠️ **주의**: `http://`가 아닌 `https://`를 사용하세요!
     - **Redirect URLs**: 다음 URL들을 추가하세요:
       - 개발 환경: `http://localhost:5173/**`
       - 프로덕션: `https://speaking-ai-five.vercel.app/**` (실제 도메인으로 변경)
       - Vercel 프리뷰: `https://*-your-team.vercel.app/**` (선택사항)
     - 이메일 확인 링크가 올바르게 작동하려면 이 설정이 필수입니다!

## 개발

의존성을 설치한 후 개발 서버를 실행하세요:

```sh
npm install
npm run dev

# 또는 브라우저에서 자동으로 열기
npm run dev -- --open
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## 사용 방법

1. **녹음 시작**: 빨간색 마이크 버튼을 클릭하여 영어로 말하세요
2. **녹음 중지**: 녹음이 끝나면 중지 버튼을 클릭하세요
3. **영어회화 연습**: "영어회화 연습" 버튼을 클릭하여 AI 튜터에게 전송하세요
4. **응답 확인**: AI 튜터의 텍스트 및 음성 응답을 확인하고 대화를 계속하세요

## 기능

- 🎤 실시간 음성 녹음
- 📊 웨이브폼 시각화
- 🤖 AI 튜터와 영어 대화 연습
- 🔊 AI 음성 응답 재생
- 💾 녹음 파일 다운로드
- 🔐 회원가입 및 로그인 기능

## 기술 스택

- **Frontend**: SvelteKit, Tailwind CSS
- **Backend**: SvelteKit API Routes
- **AI**: OpenAI Audio API (gpt-audio 모델)
- **Deployment**: Vercel

## 참고 문서

- [OpenAI Audio API 가이드](https://platform.openai.com/docs/guides/audio-and-speech)
- [Voice Agents 가이드](https://platform.openai.com/docs/guides/voice-agents)
- [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create)
