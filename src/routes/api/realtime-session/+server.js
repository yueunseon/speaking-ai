import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { instructions } = await request.json();

		// OpenAI API 키 확인
		if (!OPENAI_API_KEY) {
			return json({ error: 'OpenAI API key is not configured. Please create a .env file with OPENAI_API_KEY=your_key' }, { status: 500 });
		}

		// 영어회화 튜터 기본 프롬프트
		const defaultInstructions = `You are a friendly and patient English conversation tutor. Your role is to:
1. Help users practice English conversation
2. Provide natural, conversational responses
3. Gently correct mistakes when appropriate
4. Encourage users to speak more
5. Ask follow-up questions to keep the conversation flowing
6. Speak in a warm, encouraging tone

Keep your responses concise and natural, as if you're having a real conversation.`;

		// Realtime API 세션 생성 (HTTP API 사용)
		// 참고: 세션 생성 시 설정은 WebSocket 연결 후 session.update로 전달할 수도 있음
		const sessionConfig = {
			model: 'gpt-4o-realtime-preview',
			voice: 'alloy',
			instructions: instructions || defaultInstructions,
			modalities: ['audio', 'text'],
			input_audio_format: 'pcm16',
			output_audio_format: 'pcm16',
			temperature: 0.8,
			max_response_output_tokens: 4096
		};

		console.log('세션 생성 요청:', JSON.stringify(sessionConfig, null, 2));

		const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json',
				'OpenAI-Beta': 'realtime=v1'
			},
			body: JSON.stringify(sessionConfig)
		});

		if (!response.ok) {
			const errorText = await response.text();
			let error;
			try {
				error = JSON.parse(errorText);
			} catch (e) {
				error = { message: errorText };
			}
			console.error('Realtime API 세션 생성 실패:', {
				status: response.status,
				statusText: response.statusText,
				error: error,
				// API budget 초과 여부 확인
				isBudgetExceeded: response.status === 429 || error.error?.type === 'insufficient_quota' || error.error?.code === 'insufficient_quota'
			});
			
			// API budget 초과 에러인지 확인
			if (response.status === 429 || error.error?.type === 'insufficient_quota' || error.error?.code === 'insufficient_quota') {
				throw new Error('API 사용량이 초과되었습니다. OpenAI 계정의 사용량을 확인해주세요.');
			}
			
			throw new Error(error.error?.message || error.message || '세션 생성 실패');
		}

		const session = await response.json();
		
		// 상세 로깅 (보안을 위해 값은 일부만 표시)
		console.log('=== 세션 생성 성공 ===');
		console.log('세션 ID:', session.id);
		console.log('client_secret 존재:', !!session.client_secret);
		console.log('client_secret 타입:', typeof session.client_secret);
		
		if (session.client_secret) {
			if (typeof session.client_secret === 'object') {
				console.log('client_secret 구조 (객체):', Object.keys(session.client_secret));
				console.log('client_secret.value 존재:', !!session.client_secret.value);
				if (session.client_secret.value) {
					console.log('client_secret.value 타입:', typeof session.client_secret.value);
					console.log('client_secret.value 길이:', session.client_secret.value.length);
				}
			} else if (typeof session.client_secret === 'string') {
				console.log('client_secret 길이:', session.client_secret.length);
				console.log('client_secret 앞 5자:', session.client_secret.substring(0, 5));
				console.log('client_secret 뒤 5자:', session.client_secret.substring(session.client_secret.length - 5));
			}
		}
		console.log('전체 세션 응답 구조:', Object.keys(session));
		console.log('========================');

		// client_secret 구조 확인
		const clientSecret = session.client_secret?.value || session.client_secret;
		
		if (!clientSecret) {
			console.error('client_secret이 없습니다. 전체 세션 응답:', JSON.stringify(session, null, 2));
			throw new Error('client_secret을 받을 수 없습니다.');
		}
		
		console.log('최종 client_secret 타입:', typeof clientSecret);
		console.log('최종 client_secret 길이:', clientSecret.length);

		return json({
			session_id: session.id,
			client_secret: clientSecret
		});
	} catch (error) {
		console.error('Realtime API error:', error);
		return json(
			{
				error: error.message || 'Failed to create realtime session',
				details: error.response?.data || null
			},
			{ status: 500 }
		);
	}
}
