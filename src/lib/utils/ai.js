import { blobToBase64, base64ToBlob } from './format.js';

/**
 * AI API에 오디오 전송 및 응답 받기
 * @param {Blob} audioBlob - 녹음된 오디오 Blob
 * @param {string} format - 오디오 포맷
 * @param {Function} onDebug - 디버그 정보 콜백
 */
export async function sendAudioToAI(audioBlob, format = 'webm', onDebug = null) {
	const startTime = Date.now();
	const debugInfo = {
		request: null,
		response: null,
		error: null,
		logs: []
	};

	function addLog(message) {
		const log = {
			time: new Date().toLocaleTimeString(),
			message
		};
		debugInfo.logs.push(log);
		console.log(`[${log.time}] ${message}`);
		if (onDebug) onDebug({ ...debugInfo });
	}

	try {
		if (!audioBlob) {
			throw new Error('녹음된 오디오가 없습니다.');
		}

		addLog(`오디오 변환 시작 (크기: ${audioBlob.size} bytes)`);

		// 오디오를 base64로 변환
		const base64Audio = await blobToBase64(audioBlob);
		addLog(`Base64 변환 완료 (길이: ${base64Audio.length} chars)`);

		// 요청 정보 저장
		debugInfo.request = {
			url: '/api/chat',
			method: 'POST',
			timestamp: new Date().toISOString(),
			audioSize: audioBlob.size,
			format: format
		};

		addLog('API 요청 시작...');

		// API 호출
		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				audioData: base64Audio,
				format: format
			})
		});

		const duration = Date.now() - startTime;

		// 응답 정보 저장
		debugInfo.response = {
			status: response.status,
			statusText: response.statusText,
			timestamp: new Date().toISOString(),
			duration: duration
		};

		addLog(`응답 수신 (Status: ${response.status}, Duration: ${duration}ms)`);

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (e) {
				errorData = { 
					error: `HTTP ${response.status}: ${response.statusText}`,
					details: { parseError: e.message }
				};
			}

			debugInfo.error = {
				message: errorData.error || 'API 요청 실패',
				status: response.status,
				statusText: response.statusText,
				details: errorData.details || errorData,
				type: errorData.details?.type || 'HTTPError'
			};

			addLog(`에러 발생: ${debugInfo.error.message} (Status: ${response.status})`);
			if (errorData.details) {
				addLog(`에러 상세: ${JSON.stringify(errorData.details, null, 2)}`);
			}
			if (onDebug) onDebug({ ...debugInfo });

			const error = new Error(errorData.error || 'API 요청 실패');
			error.status = response.status;
			error.details = errorData.details;
			throw error;
		}

		addLog('응답 데이터 파싱 중...');
		const data = await response.json();
		addLog(`응답 파싱 완료 (텍스트: ${data.text ? '있음' : '없음'}, 오디오: ${data.audio ? '있음' : '없음'})`);

		// 오디오 응답이 있는 경우 Blob으로 변환
		let responseAudioBlob = null;
		if (data.audio) {
			addLog('오디오 Blob 변환 중...');
			responseAudioBlob = base64ToBlob(data.audio, `audio/${data.format || 'wav'}`);
			addLog(`오디오 Blob 변환 완료 (크기: ${responseAudioBlob.size} bytes)`);
		}

		addLog('✅ 요청 성공');
		if (onDebug) onDebug({ ...debugInfo });

		return {
			text: data.text || '',
			audio: responseAudioBlob,
			format: data.format || 'wav'
		};
	} catch (error) {
		const duration = Date.now() - startTime;
		
		debugInfo.error = {
			message: error.message || '알 수 없는 오류',
			name: error.name,
			stack: error.stack,
			duration: duration
		};

		addLog(`❌ 에러: ${error.message}`);
		if (onDebug) onDebug({ ...debugInfo });

		// 원본 에러를 다시 throw
		throw error;
	}
}
