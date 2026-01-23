// src/lib/utils/promptSettings.js

/**
 * 기본 프롬프트 설정 값
 */
export const defaultPromptSettings = {
	mode: 'preset', // 'preset' or 'custom'
	tone: 'warm',
	correctionStyle: 'gently',
	responseLength: 'concise',
	conversationStyle: 'natural',
	customPrompt: ''
};

/**
 * 프롬프트 설정을 기본값으로 초기화
 */
export function createDefaultPromptSettings() {
	return { ...defaultPromptSettings };
}

/**
 * 프롬프트 설정을 기본값으로 리셋
 */
export function resetPromptSettings() {
	return createDefaultPromptSettings();
}
