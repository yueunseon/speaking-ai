/**
 * 지원되는 오디오 MIME 타입 확인
 */
export function getSupportedAudioMimeType() {
	const options = { mimeType: 'audio/webm' };
	if (!MediaRecorder.isTypeSupported(options.mimeType)) {
		options.mimeType = 'audio/webm;codecs=opus';
		if (!MediaRecorder.isTypeSupported(options.mimeType)) {
			delete options.mimeType; // 브라우저 기본값 사용
		}
	}
	return options;
}

/**
 * 오디오 파일 다운로드
 */
export function downloadAudio(blob, filename = null) {
	if (!blob) return;
	
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	const timestamp = filename || new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
	a.href = url;
	a.download = `음성녹음-${timestamp}.webm`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
