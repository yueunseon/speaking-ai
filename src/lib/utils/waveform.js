/**
 * 웨이브폼 그리기
 */
export function drawWaveform(canvas, dataArray) {
	if (!canvas || !dataArray) return;

	const ctx = canvas.getContext('2d');

	// 캔버스 크기 조정
	const rect = canvas.getBoundingClientRect();
	if (canvas.width !== rect.width) {
		canvas.width = rect.width;
		canvas.height = rect.height;
	}

	const width = canvas.width;
	const height = canvas.height;

	// 배경 지우기
	ctx.fillStyle = '#111827';
	ctx.fillRect(0, 0, width, height);

	// 웨이브폼 그리기
	const barWidth = width / dataArray.length;
	let x = 0;

	for (let i = 0; i < dataArray.length; i++) {
		const barHeight = (dataArray[i] / 255) * height;
		const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
		gradient.addColorStop(0, '#3b82f6');
		gradient.addColorStop(0.5, '#60a5fa');
		gradient.addColorStop(1, '#93c5fd');

		ctx.fillStyle = gradient;
		ctx.fillRect(x, height - barHeight, Math.max(barWidth - 2, 1), barHeight);
		x += barWidth;
	}
}

/**
 * 웨이브폼 초기화 (배경만 그리기)
 */
export function clearWaveform(canvas) {
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#111827';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}
