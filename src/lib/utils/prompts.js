import { get } from 'svelte/store';
import { session } from '$lib/stores/auth.js';

/**
 * 저장된 프롬프트 목록 조회
 * @returns {Promise<Array>} 프롬프트 목록
 */
export async function getSavedPrompts() {
	try {
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			throw new Error('인증 토큰이 없습니다.');
		}
		
		const res = await fetch('/api/prompts', {
			headers: { Authorization: `Bearer ${currentSession.access_token}` }
		});
		
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err?.error || '프롬프트 조회에 실패했습니다.');
		}
		
		const { prompts } = await res.json();
		return Array.isArray(prompts) ? prompts : [];
	} catch (error) {
		console.error('❌ getSavedPrompts 에러:', error?.message || error);
		throw error;
	}
}

/**
 * 프롬프트 저장
 * @param {string} name - 프롬프트 이름
 * @param {Object} promptSettings - 프롬프트 설정
 * @param {boolean} isDefault - 기본 프롬프트 여부
 * @returns {Promise<Object>} 저장된 프롬프트
 */
export async function savePrompt(name, promptSettings, isDefault = false) {
	try {
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			throw new Error('인증 토큰이 없습니다.');
		}
		
		const res = await fetch('/api/prompts', {
			method: 'POST',
			headers: { 
				Authorization: `Bearer ${currentSession.access_token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: name.trim(),
				prompt_settings: promptSettings,
				is_default: isDefault
			})
		});
		
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err?.error || '프롬프트 저장에 실패했습니다.');
		}
		
		const { prompt } = await res.json();
		return prompt;
	} catch (error) {
		console.error('❌ savePrompt 에러:', error?.message || error);
		throw error;
	}
}

/**
 * 프롬프트 수정
 * @param {string} id - 프롬프트 ID
 * @param {Object} updates - 수정할 데이터 (name, prompt_settings, is_default)
 * @returns {Promise<Object>} 수정된 프롬프트
 */
export async function updatePrompt(id, updates) {
	try {
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			throw new Error('인증 토큰이 없습니다.');
		}
		
		const res = await fetch('/api/prompts', {
			method: 'PUT',
			headers: { 
				Authorization: `Bearer ${currentSession.access_token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id,
				...updates
			})
		});
		
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err?.error || '프롬프트 수정에 실패했습니다.');
		}
		
		const { prompt } = await res.json();
		return prompt;
	} catch (error) {
		console.error('❌ updatePrompt 에러:', error?.message || error);
		throw error;
	}
}

/**
 * 프롬프트 삭제
 * @param {string} id - 프롬프트 ID
 * @returns {Promise<boolean>} 성공 여부
 */
export async function deletePrompt(id) {
	try {
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			throw new Error('인증 토큰이 없습니다.');
		}
		
		const res = await fetch(`/api/prompts?id=${id}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${currentSession.access_token}` }
		});
		
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err?.error || '프롬프트 삭제에 실패했습니다.');
		}
		
		return true;
	} catch (error) {
		console.error('❌ deletePrompt 에러:', error?.message || error);
		throw error;
	}
}
