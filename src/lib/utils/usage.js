import { get } from 'svelte/store';
import { session } from '$lib/stores/auth.js';

/**
 * API 사용량 조회
 * @param {Object} params - 조회 파라미터
 * @param {string} params.sessionId - 세션 ID (선택사항)
 * @param {string} params.recordId - 기록 ID (선택사항)
 * @param {string} params.apiType - API 타입 (whisper, chat, tts) (선택사항)
 * @param {string} params.startDate - 시작 날짜 (ISO 형식) (선택사항)
 * @param {string} params.endDate - 종료 날짜 (ISO 형식) (선택사항)
 * @returns {Promise<Object>} 사용량 로그 및 통계
 */
export async function getApiUsage(params = {}) {
	try {
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			throw new Error('인증 토큰이 없습니다.');
		}

		const queryParams = new URLSearchParams();
		if (params.sessionId) queryParams.append('session_id', params.sessionId);
		if (params.recordId) queryParams.append('record_id', params.recordId);
		if (params.apiType) queryParams.append('api_type', params.apiType);
		if (params.startDate) queryParams.append('start_date', params.startDate);
		if (params.endDate) queryParams.append('end_date', params.endDate);

		const res = await fetch(`/api/usage?${queryParams.toString()}`, {
			headers: {
				'Authorization': `Bearer ${currentSession.access_token}`
			}
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err?.error || '사용량 조회에 실패했습니다.');
		}

		const data = await res.json();
		return data;
	} catch (error) {
		console.error('❌ getApiUsage 에러:', error?.message || error);
		throw error;
	}
}

/**
 * 여러 record_id에 대한 사용량 정보를 한 번에 조회
 * @param {string[]} recordIds - 기록 ID 배열
 * @returns {Promise<Object>} recordId를 키로 하는 사용량 정보 맵
 */
export async function getUsageByRecordIds(recordIds) {
	if (!recordIds || recordIds.length === 0) {
		return {};
	}

	try {
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			console.warn('인증 토큰이 없어 사용량 정보를 가져올 수 없습니다.');
			return {};
		}

		// 각 record_id에 대한 사용량 조회
		const usagePromises = recordIds.map(recordId => 
			getApiUsage({ recordId }).catch(err => {
				console.warn(`recordId ${recordId}의 사용량 조회 실패:`, err);
				return { logs: [], stats: null };
			})
		);

		const usageResults = await Promise.all(usagePromises);
		
		// recordId를 키로 하는 맵 생성
		const usageMap = {};
		recordIds.forEach((recordId, index) => {
			const result = usageResults[index];
			if (result && result.logs) {
				// 각 API 타입별로 그룹화
				const byType = {
					whisper: [],
					chat: [],
					tts: []
				};
				
				result.logs.forEach(log => {
					if (byType[log.api_type]) {
						byType[log.api_type].push(log);
					}
				});
				
				usageMap[recordId] = {
					logs: result.logs,
					byType: byType,
					totalCost: result.logs.reduce((sum, log) => sum + (parseFloat(log.cost_usd) || 0), 0),
					totalDuration: result.logs.reduce((sum, log) => sum + (parseFloat(log.duration_seconds) || 0), 0)
				};
			}
		});

		return usageMap;
	} catch (error) {
		console.error('❌ getUsageByRecordIds 에러:', error?.message || error);
		return {};
	}
}

/**
 * session_id와 시간 범위를 이용해서 사용량 정보 조회
 * @param {string} sessionId - 세션 ID
 * @param {Date} startTime - 시작 시간
 * @param {Date} endTime - 종료 시간
 * @returns {Promise<Object>} 사용량 정보
 */
export async function getUsageBySessionAndTime(sessionId, startTime, endTime) {
	try {
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			console.warn('인증 토큰이 없어 사용량 정보를 가져올 수 없습니다.');
			return null;
		}

		const usageData = await getApiUsage({
			sessionId: sessionId,
			startDate: startTime.toISOString(),
			endDate: endTime.toISOString()
		});

		if (usageData && usageData.logs) {
			// 각 API 타입별로 그룹화
			const byType = {
				whisper: [],
				chat: [],
				tts: []
			};
			
			usageData.logs.forEach(log => {
				if (byType[log.api_type]) {
					byType[log.api_type].push(log);
				}
			});
			
			return {
				logs: usageData.logs,
				byType: byType,
				totalCost: usageData.logs.reduce((sum, log) => sum + (parseFloat(log.cost_usd) || 0), 0),
				totalDuration: usageData.logs.reduce((sum, log) => sum + (parseFloat(log.duration_seconds) || 0), 0)
			};
		}

		return null;
	} catch (error) {
		console.error('❌ getUsageBySessionAndTime 에러:', error?.message || error);
		return null;
	}
}

/**
 * 사용량 로그의 record_id 업데이트
 * @param {string} recordId - 기록 ID
 * @param {string} sessionId - 세션 ID
 * @param {Object} timeRange - 시간 범위 { start, end }
 * @returns {Promise<boolean>} 성공 여부
 */
export async function updateUsageLogRecordId(recordId, sessionId, timeRange) {
	try {
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			throw new Error('인증 토큰이 없습니다.');
		}

		const res = await fetch('/api/usage/update-record-id', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${currentSession.access_token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				recordId,
				sessionId,
				timeRange
			})
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err?.error || '사용량 로그 업데이트에 실패했습니다.');
		}

		const data = await res.json();
		return data.success === true;
	} catch (error) {
		console.error('❌ updateUsageLogRecordId 에러:', error?.message || error);
		return false;
	}
}

/**
 * 사용량 포맷팅
 */
export function formatUsage(amount, unit) {
	if (unit === 'minutes') {
		return `${amount.toFixed(2)}분`;
	} else if (unit === 'tokens') {
		if (amount >= 1000) {
			return `${(amount / 1000).toFixed(2)}K 토큰`;
		}
		return `${amount.toFixed(0)} 토큰`;
	} else if (unit === 'characters') {
		if (amount >= 1000) {
			return `${(amount / 1000).toFixed(2)}K 문자`;
		}
		return `${amount.toFixed(0)} 문자`;
	}
	return `${amount.toFixed(2)} ${unit}`;
}

/**
 * 요금 포맷팅
 */
export function formatCost(costUsd) {
	return `$${costUsd.toFixed(6)}`;
}

/**
 * 시간 포맷팅
 */
export function formatDuration(seconds) {
	if (seconds < 60) {
		return `${seconds.toFixed(1)}초`;
	} else if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}분 ${secs.toFixed(0)}초`;
	} else {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return `${hours}시간 ${minutes}분`;
	}
}

/**
 * 모델 이름을 읽기 쉬운 형식으로 변환
 */
export function formatModelName(model) {
	const modelNames = {
		'whisper-1': 'Whisper',
		'gpt-4o-mini': 'GPT-4o Mini',
		'gpt-4o': 'GPT-4o',
		'tts-1': 'TTS-1',
		'tts-1-hd': 'TTS-1 HD'
	};
	return modelNames[model] || model;
}
