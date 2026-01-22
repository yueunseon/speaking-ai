/**
 * 시간을 MM:SS 형식으로 포맷팅
 */
export function formatTime(seconds) {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 오디오 Blob을 base64 문자열로 변환
 */
export async function blobToBase64(blob) {
	const arrayBuffer = await blob.arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);
	let binary = '';
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * base64 문자열을 Blob으로 변환
 */
export function base64ToBlob(base64, mimeType = 'audio/wav') {
	const audioBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
	return new Blob([audioBytes], { type: mimeType });
}
