import { getSupportedAudioMimeType } from './audio.js';
import { getMicrophoneErrorMessage } from './errors.js';

/**
 * 녹음기 클래스
 */
export class AudioRecorder {
	constructor() {
		this.mediaRecorder = null;
		this.audioChunks = [];
		this.stream = null;
		this.audioContext = null;
		this.analyser = null;
		this.dataArray = null;
	}

	/**
	 * 녹음 시작
	 */
	async startRecording(onDataAvailable, onStop, onError) {
		try {
			// 마이크 스트림 가져오기
			this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

			// AudioContext 및 AnalyserNode 설정 (웨이브폼용)
			this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.fftSize = 256;
			const source = this.audioContext.createMediaStreamSource(this.stream);
			source.connect(this.analyser);
			this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

			// MediaRecorder 설정
			const options = getSupportedAudioMimeType();
			this.mediaRecorder = new MediaRecorder(this.stream, options);
			this.audioChunks = [];

			this.mediaRecorder.ondataavailable = (event) => {
				if (event.data && event.data.size > 0) {
					this.audioChunks.push(event.data);
					if (onDataAvailable) onDataAvailable(event);
				}
			};

			this.mediaRecorder.onstop = () => {
				if (this.audioChunks.length > 0) {
					const blob = new Blob(this.audioChunks, {
						type: this.mediaRecorder.mimeType || 'audio/webm'
					});
					if (onStop) onStop(blob);
				} else {
					if (onError) onError(new Error('녹음된 데이터가 없습니다.'));
				}
				this.stream?.getTracks().forEach((track) => track.stop());
			};

			this.mediaRecorder.onerror = (event) => {
				if (onError) onError(event.error);
			};

			// 녹음 시작
			this.mediaRecorder.start(100);
			return true;
		} catch (error) {
			const errorMessage = getMicrophoneErrorMessage(error);
			if (onError) onError(new Error(errorMessage));
			return false;
		}
	}

	/**
	 * 녹음 중지
	 */
	stopRecording() {
		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			if (this.mediaRecorder.state === 'recording') {
				this.mediaRecorder.requestData();
			}
			this.mediaRecorder.stop();
		}
	}

	/**
	 * 정리
	 */
	cleanup() {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
		}
		if (this.audioContext) {
			this.audioContext.close();
		}
	}

	/**
	 * 웨이브폼 데이터 가져오기
	 */
	getWaveformData() {
		if (!this.analyser || !this.dataArray) return null;
		this.analyser.getByteFrequencyData(this.dataArray);
		return this.dataArray;
	}
}
