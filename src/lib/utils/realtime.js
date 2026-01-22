/**
 * OpenAI Realtime API 클라이언트 유틸리티
 */

export class RealtimeClient {
	constructor(clientSecret) {
		this.clientSecret = clientSecret;
		this.ws = null;
		this.isConnected = false;
		this.audioContext = null;
		this.mediaStream = null;
		this.audioWorkletNode = null;
		this.outputAudioContext = null;
		this.outputSource = null;
		this.eventHandlers = {};
		this.audioBuffer = [];
		this.waveformCallback = null;
	}

	/**
	 * WebSocket 연결 시작
	 */
	async connect() {
		return new Promise((resolve, reject) => {
			try {
				// client_secret 유효성 검사
				if (!this.clientSecret || typeof this.clientSecret !== 'string') {
					throw new Error('client_secret이 유효하지 않습니다.');
				}
				
				// Realtime API WebSocket URL
				// 참고: Realtime API는 client_secret을 URL 파라미터로 받지만,
				// 일부 경우 Authorization 헤더가 필요할 수 있음
				// WebSocket은 헤더를 직접 설정할 수 없으므로 URL 파라미터 사용
				const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview&client_secret=${encodeURIComponent(this.clientSecret)}`;
				
				console.log('WebSocket 연결 시도:', {
					url: wsUrl.replace(this.clientSecret, '***'),
					clientSecretLength: this.clientSecret.length,
					clientSecretType: typeof this.clientSecret,
					encodedLength: encodeURIComponent(this.clientSecret).length,
					clientSecretFirstChars: this.clientSecret.substring(0, 5),
					clientSecretLastChars: this.clientSecret.substring(this.clientSecret.length - 5)
				});
				
				// WebSocket 연결 생성
				// 참고: WebSocket은 헤더를 직접 설정할 수 없으므로 URL 파라미터 사용
				this.ws = new WebSocket(wsUrl);

				let connectionTimeout;
				let resolved = false;

				this.ws.onopen = () => {
					console.log('Realtime API WebSocket 연결됨');
					clearTimeout(connectionTimeout);
					
					// 이벤트 핸들러 설정
					this.setupEventHandlers();
					
					// 연결 완료 표시
					this.isConnected = true;
					
					// 연결 후 세션 설정 확인을 위해 잠시 대기
					// Realtime API는 연결 후 자동으로 세션 정보를 전송할 수 있음
					setTimeout(() => {
						console.log('WebSocket 연결 완료, 세션 준비됨');
					}, 100);
					
					if (!resolved) {
						resolved = true;
						resolve();
					}
				};

				this.ws.onerror = (error) => {
					console.error('WebSocket 에러:', error);
					clearTimeout(connectionTimeout);
					this.isConnected = false;
					if (!resolved) {
						resolved = true;
						reject(new Error('WebSocket 연결 에러'));
					}
				};

				this.ws.onclose = (event) => {
					console.log('WebSocket 연결 종료:', event.code, event.reason);
					clearTimeout(connectionTimeout);
					this.isConnected = false;
					this.cleanup();
					
					// 연결 실패 시 에러 발생
					if (!resolved) {
						resolved = true;
						reject(new Error(`WebSocket 연결 종료: ${event.code} ${event.reason || '알 수 없는 이유'}`));
					}
				};

				this.ws.onmessage = (event) => {
					try {
						const message = JSON.parse(event.data);
						console.log('WebSocket 메시지 수신:', message.type || 'unknown');
						this.handleMessage(message);
					} catch (e) {
						console.error('메시지 파싱 실패:', e, event.data);
					}
				};

				// 연결 타임아웃 (10초)
				connectionTimeout = setTimeout(() => {
					if (!resolved) {
						resolved = true;
						this.ws?.close();
						reject(new Error('WebSocket 연결 타임아웃'));
					}
				}, 10000);
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * 이벤트 핸들러 설정
	 */
	setupEventHandlers() {
		// 세션 업데이트 이벤트
		this.on('session.updated', (event) => {
			console.log('세션 업데이트:', event);
			// 세션이 준비되었음을 표시
			if (event.session) {
				console.log('세션 준비 완료:', event.session);
			}
		});

		// 세션 생성 완료 이벤트
		this.on('session.created', (event) => {
			console.log('세션 생성됨:', event);
		});

		// 응답 시작
		this.on('response.audio_transcript.delta', (event) => {
			if (this.eventHandlers['transcript']) {
				this.eventHandlers['transcript'].forEach(handler => handler(event.delta));
			}
		});

		// 오디오 델타 (스트리밍)
		this.on('response.audio.delta', (event) => {
			if (this.eventHandlers['audio']) {
				this.eventHandlers['audio'].forEach(handler => handler(event.delta));
			}
		});

		// 응답 완료
		this.on('response.done', (event) => {
			console.log('응답 완료:', event);
			// 남은 오디오 버퍼 플러시
			this.flushAudioBuffer();
			if (this.eventHandlers['done']) {
				this.eventHandlers['done'].forEach(handler => handler(event));
			}
		});

		// 에러 처리 (setupEventHandlers에서는 기본 로깅만 수행)
		// 실제 에러 핸들러는 handleMessage에서 직접 호출하므로 여기서는 제거
	}

	/**
	 * 메시지 처리
	 */
	handleMessage(message) {
		const eventType = message.type;
		
		// 에러 메시지 상세 로깅 및 처리
		if (eventType === 'error') {
			console.error('Realtime API 에러 상세:', {
				type: message.type,
				event_id: message.event_id,
				error: message.error,
				error_type: message.error?.type,
				error_message: message.error?.message,
				error_code: message.error?.code,
				full_message: message
			});
			
			// 에러 이벤트 핸들러 호출 (무한 루프 방지를 위해 직접 호출)
			if (this.eventHandlers['error'] && this.eventHandlers['error'].length > 0) {
				const errorObj = new Error(message.error?.message || message.error?.type || 'Realtime API 에러');
				errorObj.errorDetails = message.error;
				// 핸들러를 복사하여 무한 루프 방지
				const handlers = [...this.eventHandlers['error']];
				handlers.forEach(handler => {
					try {
						handler(errorObj);
					} catch (e) {
						console.error('에러 핸들러 실행 실패:', e);
					}
				});
			}
			return;
		}
		
		// 일반 이벤트 처리
		if (this.eventHandlers[eventType] && this.eventHandlers[eventType].length > 0) {
			// 핸들러를 복사하여 무한 루프 방지
			const handlers = [...this.eventHandlers[eventType]];
			handlers.forEach(handler => {
				try {
					handler(message);
				} catch (e) {
					console.error(`이벤트 핸들러 실행 실패 (${eventType}):`, e);
				}
			});
		}
	}

	/**
	 * 이벤트 리스너 등록
	 */
	on(eventType, handler) {
		if (!this.eventHandlers[eventType]) {
			this.eventHandlers[eventType] = [];
		}
		if (!this.eventHandlers[eventType].includes(handler)) {
			this.eventHandlers[eventType].push(handler);
		}
	}

	/**
	 * 이벤트 리스너 제거
	 */
	off(eventType, handler) {
		if (this.eventHandlers[eventType]) {
			this.eventHandlers[eventType] = this.eventHandlers[eventType].filter(h => h !== handler);
		}
	}

	/**
	 * 마이크 스트림 시작
	 */
	async startMicrophone() {
		try {
			// 먼저 기본 설정으로 시도
			let audioConstraints = {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true
			};

			// sampleRate는 선택적 (브라우저가 지원하지 않을 수 있음)
			try {
				audioConstraints.sampleRate = 24000;
			} catch (e) {
				console.warn('sampleRate 설정 실패, 기본값 사용');
			}

			console.log('마이크 접근 시도 중...', audioConstraints);
			this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
				audio: audioConstraints
			});

			console.log('마이크 스트림 획득 성공:', this.mediaStream);

			// AudioContext 생성 (sampleRate는 선택적)
			try {
				this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
					sampleRate: 24000
				});
			} catch (e) {
				console.warn('24000Hz AudioContext 생성 실패, 기본값 사용:', e);
				this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
			}

			console.log('AudioContext 생성 성공, sampleRate:', this.audioContext.sampleRate);

			// MediaStreamSource 생성
			const source = this.audioContext.createMediaStreamSource(this.mediaStream);
			
			// ScriptProcessorNode를 사용하여 오디오 데이터 캡처
			// 참고: ScriptProcessorNode는 deprecated이지만 넓은 브라우저 호환성을 위해 사용
			const bufferSize = 4096;
			let processor;
			
			try {
				processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
			} catch (e) {
				console.error('ScriptProcessorNode 생성 실패:', e);
				throw new Error('오디오 프로세서를 생성할 수 없습니다. 브라우저를 업데이트해주세요.');
			}
			
			processor.onaudioprocess = (e) => {
				if (!this.isConnected) return;
				
				const inputData = e.inputBuffer.getChannelData(0);
				
				// 웨이브폼 데이터 업데이트
				if (this.waveformCallback) {
					const waveformData = new Uint8Array(inputData.length);
					for (let i = 0; i < inputData.length; i++) {
						waveformData[i] = Math.abs(inputData[i]) * 255;
					}
					this.waveformCallback(waveformData);
				}
				
				// Float32를 Int16 PCM으로 변환
				const pcm16 = this.float32ToPCM16(inputData);
				
				// Base64로 인코딩하여 전송
				const base64 = this.arrayBufferToBase64(pcm16.buffer);
				this.sendAudio(base64);
			};

			source.connect(processor);
			processor.connect(this.audioContext.destination);

			console.log('마이크 스트림 시작됨');
		} catch (error) {
			console.error('마이크 시작 실패 - 상세 정보:', {
				name: error.name,
				message: error.message,
				stack: error.stack,
				constraint: error.constraint
			});
			
			// 더 자세한 에러 메시지 생성
			let errorMessage = '마이크 시작에 실패했습니다.';
			
			if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
				errorMessage = '마이크 접근이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
			} else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
				errorMessage = '마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.';
			} else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
				errorMessage = '마이크가 다른 프로그램에서 사용 중입니다. 다른 프로그램을 종료하고 다시 시도해주세요.';
			} else if (error.name === 'OverconstrainedError') {
				errorMessage = `요청한 마이크 설정을 지원하지 않습니다. (${error.constraint || '알 수 없음'})`;
			} else if (error.message) {
				errorMessage = `마이크 오류: ${error.message}`;
			}
			
			const detailedError = new Error(errorMessage);
			detailedError.originalError = error;
			throw detailedError;
		}
	}

	/**
	 * Float32를 PCM16으로 변환
	 */
	float32ToPCM16(float32Array) {
		const int16Array = new Int16Array(float32Array.length);
		for (let i = 0; i < float32Array.length; i++) {
			const s = Math.max(-1, Math.min(1, float32Array[i]));
			int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
		}
		return int16Array;
	}

	/**
	 * ArrayBuffer를 Base64로 변환
	 */
	arrayBufferToBase64(buffer) {
		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	/**
	 * 오디오 데이터 전송
	 */
	sendAudio(base64Audio) {
		if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
			return;
		}

		try {
			this.ws.send(JSON.stringify({
				type: 'input_audio_buffer.append',
				audio: base64Audio
			}));
		} catch (error) {
			console.error('오디오 전송 실패:', error);
		}
	}

	/**
	 * 오디오 출력 처리
	 */
	setupAudioOutput() {
		this.outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({
			sampleRate: 24000
		});
	}

	/**
	 * 웨이브폼 콜백 설정
	 */
	setWaveformCallback(callback) {
		this.waveformCallback = callback;
	}

	/**
	 * Base64 오디오를 재생 (스트리밍)
	 */
	playAudio(base64Audio) {
		if (!this.outputAudioContext) {
			this.setupAudioOutput();
		}

		// Base64를 ArrayBuffer로 변환
		const binary = atob(base64Audio);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}

		// Int16 PCM을 Float32로 변환
		const int16Array = new Int16Array(bytes.buffer);
		const float32Array = new Float32Array(int16Array.length);
		for (let i = 0; i < int16Array.length; i++) {
			float32Array[i] = int16Array[i] / 32768.0;
		}

		// 오디오 버퍼에 추가
		this.audioBuffer.push(float32Array);

		// 버퍼가 충분히 쌓이면 재생
		if (this.audioBuffer.length >= 2) {
			this.flushAudioBuffer();
		}
	}

	/**
	 * 오디오 버퍼 플러시 및 재생
	 */
	flushAudioBuffer() {
		if (this.audioBuffer.length === 0) return;

		// 모든 버퍼를 합치기
		const totalLength = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
		const combined = new Float32Array(totalLength);
		let offset = 0;
		for (const buf of this.audioBuffer) {
			combined.set(buf, offset);
			offset += buf.length;
		}
		this.audioBuffer = [];

		// AudioBuffer 생성 및 재생
		const audioBuffer = this.outputAudioContext.createBuffer(1, combined.length, 24000);
		audioBuffer.getChannelData(0).set(combined);
		
		const source = this.outputAudioContext.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(this.outputAudioContext.destination);
		source.start();

		this.outputSource = source;
	}

	/**
	 * 대화 시작 (입력 오디오 버퍼 시작)
	 */
	startConversation() {
		if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.warn('대화 시작 실패: WebSocket이 연결되지 않음');
			return;
		}

		try {
			// 입력 오디오 버퍼 커밋 (대화 시작)
			this.ws.send(JSON.stringify({
				type: 'input_audio_buffer.commit'
			}));
			console.log('대화 시작 메시지 전송됨');
		} catch (error) {
			console.error('대화 시작 메시지 전송 실패:', error);
		}
	}

	/**
	 * 연결 종료
	 */
	disconnect() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.cleanup();
	}

	/**
	 * 리소스 정리
	 */
	cleanup() {
		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach(track => track.stop());
			this.mediaStream = null;
		}

		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}

		if (this.outputAudioContext) {
			this.outputAudioContext.close();
			this.outputAudioContext = null;
		}

		this.isConnected = false;
	}
}
