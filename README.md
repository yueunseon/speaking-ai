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

프로젝트 루트에 `.env` 파일을 생성하고 OpenAI API 키를 추가하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

OpenAI API 키는 [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급받을 수 있습니다.

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

## 기술 스택

- **Frontend**: SvelteKit, Tailwind CSS
- **Backend**: SvelteKit API Routes
- **AI**: OpenAI Audio API (gpt-audio 모델)
- **Deployment**: Vercel

## 참고 문서

- [OpenAI Audio API 가이드](https://platform.openai.com/docs/guides/audio-and-speech)
- [Voice Agents 가이드](https://platform.openai.com/docs/guides/voice-agents)
- [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create)
