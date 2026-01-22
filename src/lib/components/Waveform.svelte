<script>
	import { onMount, onDestroy } from 'svelte';
	import { drawWaveform, clearWaveform } from '$lib/utils/waveform.js';
	
	let { dataArray, isRecording } = $props();
	let canvasElement;
	let animationFrame = null;

	function animate() {
		if (isRecording && dataArray) {
			drawWaveform(canvasElement, dataArray);
			animationFrame = requestAnimationFrame(animate);
		}
	}

	$effect(() => {
		if (isRecording && dataArray) {
			animate();
		} else {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
				animationFrame = null;
			}
			if (canvasElement) {
				clearWaveform(canvasElement);
			}
		}
	});

	onDestroy(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
	});
</script>

<div class="w-full mb-4">
	<div class="bg-gray-900 rounded-lg border-2 border-gray-700 p-4">
		<canvas
			bind:this={canvasElement}
			width="600"
			height="150"
			class="w-full h-32 rounded"
		></canvas>
	</div>
</div>
