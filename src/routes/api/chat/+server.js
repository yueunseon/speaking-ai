import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import { writeFileSync, unlinkSync, createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';
import { 
	logApiUsage, 
	calculateWhisperUsage, 
	calculateTTSUsage, 
	calculateChatUsage,
	calculateAudioDuration
} from '$lib/utils/api-usage.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		// 사용자 인증 확인
		const authHeader = request.headers.get('authorization');
		let userId = null;
		let sessionId = null;
		let authToken = null;
		
		if (authHeader) {
			authToken = authHeader.replace('Bearer ', '');
			const supabase = createSupabaseServerClient();
			const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
			if (user) {
				userId = user.id;
				console.log('✅ 사용자 인증 성공:', userId);
			} else {
				console.warn('⚠️ 사용자 인증 실패:', authError?.message || '사용자를 찾을 수 없습니다.');
			}
		} else {
			console.warn('⚠️ Authorization 헤더가 없습니다.');
		}

		const { audioData, format = 'webm', instructions, session_id } = await request.json();
		sessionId = session_id || null;

		if (!audioData) {
			return json({ error: 'Audio data is required' }, { status: 400 });
		}

		// OpenAI API 키 확인
		if (!OPENAI_API_KEY) {
			return json({ error: 'OpenAI API key is not configured. Please create a .env file with OPENAI_API_KEY=your_key' }, { status: 500 });
		}

		const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

		// 영어회화 튜터 프롬프트 (커스텀 프롬프트가 있으면 사용, 없으면 기본값)
		const defaultInstructions = `You are a friendly and patient English conversation tutor. Your role is to:
1. Help users practice English conversation
2. Provide natural, conversational responses
3. Gently correct mistakes when appropriate
4. Encourage users to speak more
5. Ask follow-up questions to keep the conversation flowing
6. Speak in a warm, encouraging tone

Keep your responses concise and natural, as if you're having a real conversation.`;

		const systemPrompt = instructions || defaultInstructions;

		console.log('OpenAI API 호출 시작...');
		console.log('Audio data length:', audioData?.length || 0);
		console.log('Format:', format);

		// 1단계: 오디오를 텍스트로 변환 (Whisper API)
		console.log('1단계: 오디오를 텍스트로 변환 중...');
		const audioBuffer = Buffer.from(audioData, 'base64');
		
		// 오디오 재생 시간 계산
		const audioDurationSeconds = await calculateAudioDuration(audioBuffer, format);
		
		// 임시 파일 생성 (OpenAI SDK가 File 객체를 요구하므로)
		const tempFilePath = join(tmpdir(), `audio_${Date.now()}.${format}`);
		writeFileSync(tempFilePath, audioBuffer);
		
		let transcription;
		const whisperStartTime = Date.now();
		try {
			// OpenAI SDK는 Node.js에서 File 객체를 직접 받을 수 없으므로
			// fs.createReadStream을 사용하여 파일을 읽어서 전달
			// OpenAI SDK v6+는 Readable stream을 직접 받을 수 있음
			const fileStream = createReadStream(tempFilePath);
			
			// File-like 객체 생성 (OpenAI SDK가 요구하는 형식)
			// Readable stream에 name과 type 속성 추가
			const fileLike = Object.assign(fileStream, {
				name: `audio.${format}`,
				type: `audio/${format}`
			});
			
			console.log('Whisper API 호출 중...');
			transcription = await openai.audio.transcriptions.create({
				file: fileLike,
				model: 'whisper-1',
				language: 'en'
			});
			console.log('Whisper API 호출 성공');
			
			// Whisper API 사용량 기록
			if (userId) {
				const whisperDuration = (Date.now() - whisperStartTime) / 1000;
				const whisperUsage = calculateWhisperUsage(audioDurationSeconds);
				await logApiUsage({
					userId,
					apiType: 'whisper',
					usageAmount: whisperUsage.usageAmount,
					usageUnit: whisperUsage.usageUnit,
					costUsd: whisperUsage.costUsd,
					durationSeconds: whisperDuration,
					model: 'whisper-1',
					sessionId,
					authToken
				});
			} else {
				console.warn('⚠️ Whisper API 사용량 기록 건너뜀: userId 없음');
			}
		} catch (transcriptionError) {
			console.error('Whisper API 에러:', transcriptionError);
			console.error('에러 상세:', transcriptionError.message);
			console.error('에러 스택:', transcriptionError.stack);
			throw transcriptionError;
		} finally {
			// 임시 파일 삭제
			try {
				unlinkSync(tempFilePath);
			} catch (e) {
				console.warn('임시 파일 삭제 실패:', e);
			}
		}

		const userText = transcription.text;
		console.log('변환된 텍스트:', userText);

		// 2단계: 텍스트로 대화 생성 (Chat Completions)
		console.log('2단계: AI 응답 생성 중...');
		const chatStartTime = Date.now();
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini', // 빠르고 경제적인 모델
			messages: [
				{
					role: 'system',
					content: systemPrompt
				},
				{
					role: 'user',
					content: userText
				}
			],
			max_tokens: 150
		});

		const aiResponseText = completion.choices[0].message.content;
		console.log('AI 응답 텍스트:', aiResponseText);
		
		// Chat Completions API 사용량 기록
		if (userId) {
			const chatDuration = (Date.now() - chatStartTime) / 1000;
			const inputTokens = completion.usage?.prompt_tokens || 0;
			const outputTokens = completion.usage?.completion_tokens || 0;
			const chatUsage = calculateChatUsage(inputTokens, outputTokens, 'gpt-4o-mini');
			await logApiUsage({
				userId,
				apiType: 'chat',
				usageAmount: chatUsage.usageAmount,
				usageUnit: chatUsage.usageUnit,
				costUsd: chatUsage.costUsd,
				durationSeconds: chatDuration,
				model: 'gpt-4o-mini',
				sessionId,
				metadata: chatUsage.metadata,
				authToken
			});
		} else {
			console.warn('⚠️ Chat API 사용량 기록 건너뜀: userId 없음');
		}

		// 3단계: 텍스트를 음성으로 변환 (TTS API)
		console.log('3단계: 텍스트를 음성으로 변환 중...');
		const ttsStartTime = Date.now();
		const audioResponse = await openai.audio.speech.create({
			model: 'tts-1',
			voice: 'alloy',
			input: aiResponseText
		});
		
		// 사용자 텍스트도 함께 반환

		const audioBufferResponse = Buffer.from(await audioResponse.arrayBuffer());
		const base64Audio = audioBufferResponse.toString('base64');
		
		// TTS API 사용량 기록
		if (userId) {
			const ttsDuration = (Date.now() - ttsStartTime) / 1000;
			const ttsUsage = calculateTTSUsage(aiResponseText);
			await logApiUsage({
				userId,
				apiType: 'tts',
				usageAmount: ttsUsage.usageAmount,
				usageUnit: ttsUsage.usageUnit,
				costUsd: ttsUsage.costUsd,
				durationSeconds: ttsDuration,
				model: 'tts-1',
				sessionId,
				authToken
			});
		} else {
			console.warn('⚠️ TTS API 사용량 기록 건너뜀: userId 없음');
		}

		// 응답 반환 (사용자 텍스트와 AI 응답 텍스트 모두 포함)
		return json({
			userText: userText, // 사용자가 말한 내용
			text: aiResponseText, // AI 튜터 응답
			audio: base64Audio,
			format: 'mp3' // TTS API는 mp3 형식 반환
		});
	} catch (error) {
		console.error('OpenAI API error:', error);
		console.error('Error stack:', error.stack);
		
		// 에러 타입에 따른 상세 정보 수집
		let errorDetails = {
			message: error.message || 'Failed to process audio',
			type: error.constructor?.name || 'UnknownError',
			status: error.status || error.response?.status || 500
		};

		// OpenAI API 에러인 경우
		if (error.response) {
			errorDetails.openaiError = {
				status: error.response.status,
				statusText: error.response.statusText,
				data: error.response.data
			};
		}

		// OpenAI SDK 에러인 경우
		if (error.error) {
			errorDetails.openaiError = {
				message: error.error.message,
				type: error.error.type,
				code: error.error.code,
				param: error.error.param
			};
			// OpenAI SDK 에러 메시지를 메인 메시지로 사용
			if (error.error.message) {
				errorDetails.message = error.error.message;
			}
		}

		// OpenAI APIError 객체 확인
		if (error.constructor?.name === 'APIError' || error.status) {
			errorDetails.openaiError = {
				message: error.message,
				status: error.status,
				code: error.code,
				type: error.type,
				param: error.param
			};
			if (error.message) {
				errorDetails.message = error.message;
			}
			if (error.status) {
				errorDetails.status = error.status;
			}
		}

		// OpenAI API 호출 실패 시 더 자세한 정보
		if (error.status) {
			errorDetails.httpStatus = error.status;
		}

		// 요청 정보
		errorDetails.requestInfo = {
			hasAudioData: !!audioData,
			audioDataLength: audioData?.length || 0,
			format: format,
			model: 'gpt-audio'
		};

		// 스택 트레이스 (개발 환경에서만)
		if (process.env.NODE_ENV === 'development') {
			errorDetails.stack = error.stack;
		}

		return json(
			{
				error: errorDetails.message,
				details: errorDetails
			},
			{ status: errorDetails.status }
		);
	}
}
