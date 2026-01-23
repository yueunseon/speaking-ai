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

/**
 * 현재 시간을 서울 시간(KST, UTC+9)으로 ISO 문자열로 반환
 * @returns {string} 서울 시간의 ISO 문자열 (예: "2026-01-22T23:50:35.000+09:00")
 */
export function getSeoulTimeISOString() {
	const now = new Date();
	// 서울 시간대 오프셋 (UTC+9)
	const seoulOffset = 9 * 60; // 분 단위
	const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
	const seoulTime = new Date(utc + (seoulOffset * 60000));
	
	// ISO 문자열로 변환 (서울 시간대 포함)
	const year = seoulTime.getFullYear();
	const month = String(seoulTime.getMonth() + 1).padStart(2, '0');
	const day = String(seoulTime.getDate()).padStart(2, '0');
	const hours = String(seoulTime.getHours()).padStart(2, '0');
	const minutes = String(seoulTime.getMinutes()).padStart(2, '0');
	const seconds = String(seoulTime.getSeconds()).padStart(2, '0');
	const milliseconds = String(seoulTime.getMilliseconds()).padStart(3, '0');
	
	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+09:00`;
}
