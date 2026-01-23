import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';

/**
 * OpenAI API 사용량 기록
 * @param {Object} params - 사용량 정보
 * @param {string} params.userId - 사용자 ID
 * @param {string} params.apiType - API 타입 (whisper, chat, tts)
 * @param {number} params.usageAmount - 사용량
 * @param {string} params.usageUnit - 사용량 단위 (minutes, tokens, characters)
 * @param {number} params.costUsd - USD 기준 요금
 * @param {number} params.durationSeconds - API 호출 소요 시간 (초)
 * @param {string} params.model - 사용된 모델
 * @param {string} params.sessionId - 세션 ID (선택사항)
 * @param {string} params.recordId - 기록 ID (선택사항)
 * @param {Object} params.metadata - 추가 메타데이터 (선택사항)
 * @returns {Promise<Object>} 저장된 로그
 */
export async function logApiUsage({
	userId,
	apiType,
	usageAmount,
	usageUnit,
	costUsd,
	durationSeconds,
	model,
	sessionId = null,
	recordId = null,
	metadata = null,
	authToken = null
}) {
	try {
		if (!userId) {
			console.warn('⚠️ logApiUsage: userId가 없어 사용량을 기록할 수 없습니다.');
			return null;
		}

		console.log('📊 API 사용량 기록 시작:', { 
			userId, 
			apiType, 
			usageAmount, 
			usageUnit, 
			costUsd,
			hasAuthToken: !!authToken
		});

		const supabase = createSupabaseServerClient();
		
		// 인증 토큰이 있으면 세션 설정
		if (authToken) {
			const { data: { session }, error: sessionError } = await supabase.auth.setSession({
				access_token: authToken,
				refresh_token: '' // refresh_token은 필요 없음
			});
			
			if (sessionError) {
				console.warn('⚠️ 세션 설정 실패 (계속 진행):', sessionError.message);
			}
		}

		// Supabase REST API 직접 사용 (RLS 정책 적용을 위해)
		const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } = await import('$env/static/public');
		
		const insertData = {
			user_id: userId,
			session_id: sessionId,
			record_id: recordId,
			api_type: apiType,
			usage_amount: usageAmount,
			usage_unit: usageUnit,
			cost_usd: costUsd,
			duration_seconds: durationSeconds,
			model: model,
			metadata: metadata
		};

		console.log('📤 사용량 데이터:', insertData);

		const response = await fetch(
			`${PUBLIC_SUPABASE_URL}/rest/v1/api_usage_logs`,
			{
				method: 'POST',
				headers: {
					'apikey': PUBLIC_SUPABASE_ANON_KEY,
					'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${PUBLIC_SUPABASE_ANON_KEY}`,
					'Content-Type': 'application/json',
					'Prefer': 'return=representation'
				},
				body: JSON.stringify(insertData)
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ API 사용량 기록 실패:', response.status, errorText);
			try {
				const errorJson = JSON.parse(errorText);
				console.error('에러 상세:', errorJson);
			} catch (e) {
				// JSON 파싱 실패는 무시
			}
			return null;
		}

		const result = await response.json();
		const logData = Array.isArray(result) ? result[0] : result;
		
		console.log('✅ API 사용량 기록 성공:', { 
			id: logData?.id, 
			apiType, 
			usageAmount, 
			costUsd 
		});
		
		return logData;
	} catch (error) {
		console.error('❌ API 사용량 기록 중 오류:', error);
		console.error('에러 스택:', error.stack);
		// 에러가 발생해도 API 호출은 계속 진행되도록 함
		return null;
	}
}

/**
 * 오디오 파일의 재생 시간 계산 (초 단위)
 * @param {Buffer} audioBuffer - 오디오 버퍼
 * @param {string} format - 오디오 포맷
 * @returns {Promise<number>} 재생 시간 (초)
 */
export async function calculateAudioDuration(audioBuffer, format) {
	try {
		// 간단한 추정: 파일 크기 기반으로 대략적인 재생 시간 계산
		// 실제로는 오디오 메타데이터를 파싱해야 정확함
		// 여기서는 대략적인 추정값 사용
		
		// WebM/MP3의 경우 대략적인 비트레이트 추정
		// 일반적으로 64kbps ~ 128kbps 정도
		const estimatedBitrate = 64000; // 64kbps
		const fileSizeBytes = audioBuffer.length;
		const fileSizeBits = fileSizeBytes * 8;
		const durationSeconds = fileSizeBits / estimatedBitrate;
		
		return Math.max(0.1, durationSeconds); // 최소 0.1초
	} catch (error) {
		console.error('오디오 재생 시간 계산 실패:', error);
		return 0;
	}
}

/**
 * OpenAI API 가격 정보
 */
export const OPENAI_PRICING = {
	whisper: {
		pricePerMinute: 0.006, // $0.006 per minute
		unit: 'minutes'
	},
	tts: {
		pricePerMillionCharacters: 15.0, // $15 per 1M characters
		unit: 'characters'
	},
	chat: {
		'gpt-4o-mini': {
			inputPricePerMillionTokens: 0.25, // $0.25 per 1M tokens
			outputPricePerMillionTokens: 2.0, // $2.00 per 1M tokens
			unit: 'tokens'
		}
	}
};

/**
 * Whisper API 사용량 및 요금 계산
 * @param {number} durationSeconds - 오디오 재생 시간 (초)
 * @returns {Object} 사용량 정보
 */
export function calculateWhisperUsage(durationSeconds) {
	const durationMinutes = durationSeconds / 60;
	const cost = durationMinutes * OPENAI_PRICING.whisper.pricePerMinute;
	
	return {
		usageAmount: durationMinutes,
		usageUnit: 'minutes',
		costUsd: cost
	};
}

/**
 * TTS API 사용량 및 요금 계산
 * @param {string} text - 변환할 텍스트
 * @returns {Object} 사용량 정보
 */
export function calculateTTSUsage(text) {
	const characterCount = text.length;
	const characterCountMillion = characterCount / 1000000;
	const cost = characterCountMillion * OPENAI_PRICING.tts.pricePerMillionCharacters;
	
	return {
		usageAmount: characterCount,
		usageUnit: 'characters',
		costUsd: cost
	};
}

/**
 * Chat Completions API 사용량 및 요금 계산
 * @param {number} inputTokens - 입력 토큰 수
 * @param {number} outputTokens - 출력 토큰 수
 * @param {string} model - 모델 이름
 * @returns {Object} 사용량 정보
 */
export function calculateChatUsage(inputTokens, outputTokens, model = 'gpt-4o-mini') {
	const modelPricing = OPENAI_PRICING.chat[model];
	if (!modelPricing) {
		console.warn(`알 수 없는 모델: ${model}, 기본 가격 사용`);
		return {
			usageAmount: inputTokens + outputTokens,
			usageUnit: 'tokens',
			costUsd: 0
		};
	}
	
	const inputTokensMillion = inputTokens / 1000000;
	const outputTokensMillion = outputTokens / 1000000;
	const inputCost = inputTokensMillion * modelPricing.inputPricePerMillionTokens;
	const outputCost = outputTokensMillion * modelPricing.outputPricePerMillionTokens;
	const totalCost = inputCost + outputCost;
	
	return {
		usageAmount: inputTokens + outputTokens,
		usageUnit: 'tokens',
		costUsd: totalCost,
		metadata: {
			inputTokens,
			outputTokens
		}
	};
}
