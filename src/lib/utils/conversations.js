import { get } from 'svelte/store';
import { session } from '$lib/stores/auth.js';

/**
 * 사용자의 대화 세션 목록 조회
 * API 라우트(/api/conversations/sessions)를 fetch로 호출. Supabase 클라이언트 쿼리는
 * thenable 미해결 등으로 fetch가 전송되지 않는 이슈가 있어 API 경유로 처리.
 * @param {string} userId - 사용자 ID (호환용, API는 토큰으로 사용자 식별)
 * @returns {Promise<Array>} 세션 목록
 */
export async function getConversationSessions(userId) {
	try {
		console.log('📡 getConversationSessions 시작', { userId });
		const currentSession = get(session);
		console.log('📡 session store:', { hasSession: !!currentSession, hasToken: !!currentSession?.access_token });
		if (!currentSession?.access_token) {
			console.log('❌ getConversationSessions: access_token 없음');
			return [];
		}
		console.log('📡 fetch 시작: /api/conversations/sessions');
		const res = await fetch('/api/conversations/sessions', {
			headers: { Authorization: `Bearer ${currentSession.access_token}` }
		});
		console.log('📡 fetch 응답:', { status: res.status, ok: res.ok });
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			console.error('❌ fetch 실패:', err);
			throw new Error(err?.error || '세션 조회에 실패했습니다.');
		}
		const responseData = await res.json();
		console.log('📡 API 응답 데이터:', responseData);
		const { sessions } = responseData;
		console.log('✅ getConversationSessions 성공:', { 
			sessionCount: sessions?.length || 0,
			sessions: sessions 
		});
		return Array.isArray(sessions) ? sessions : [];
	} catch (error) {
		console.error('❌ getConversationSessions 에러:', error?.message || error);
		throw error;
	}
}

/**
 * 새 대화 세션 생성
 * API 라우트(/api/conversations/sessions) POST를 fetch로 호출
 * @param {string|null} title - 세션 제목 (사용하지 않음, 호환성을 위해 유지)
 * @param {string} userId - 사용자 ID (호환용, API는 토큰으로 사용자 식별)
 * @returns {Promise<Object>} 생성된 세션
 */
export async function createConversationSession(title, userId) {
	try {
		console.log('createConversationSession: 시작', { userId });
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			throw new Error('인증 토큰이 없습니다.');
		}
		console.log('📡 fetch 시작: /api/conversations/sessions (POST)');
		const res = await fetch('/api/conversations/sessions', {
			method: 'POST',
			headers: { 
				Authorization: `Bearer ${currentSession.access_token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ title: null })
		});
		console.log('📡 fetch 응답:', { status: res.status, ok: res.ok });
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			console.error('❌ fetch 실패:', err);
			throw new Error(err?.error || '세션 생성에 실패했습니다.');
		}
		const { session: newSession } = await res.json();
		console.log('✅ createConversationSession 성공:', newSession);
		return newSession;
	} catch (error) {
		console.error('❌ createConversationSession 에러:', error?.message || error);
		throw error;
	}
}

/**
 * 대화 기록 저장
 * API 라우트(/api/conversations/records) POST를 fetch로 호출
 * @param {Object} recordData - 기록 데이터
 * @param {string} userId - 사용자 ID (호환용, API는 토큰으로 사용자 식별)
 * @returns {Promise<Object>} 저장된 기록
 */
export async function saveConversationRecord(recordData, userId) {
	try {
		console.log('📡 saveConversationRecord 시작', { sessionId: recordData.session_id, hasUserText: !!recordData.user_text, hasAiText: !!recordData.ai_text });
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			throw new Error('인증 토큰이 없습니다.');
		}
		console.log('📡 fetch 시작: /api/conversations/records (POST)');
		const res = await fetch('/api/conversations/records', {
			method: 'POST',
			headers: { 
				Authorization: `Bearer ${currentSession.access_token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				session_id: recordData.session_id,
				user_audio_url: recordData.user_audio_url || null,
				user_text: recordData.user_text || null,
				ai_text: recordData.ai_text || null,
				ai_audio_url: recordData.ai_audio_url || null
			})
		});
		console.log('📡 fetch 응답:', { status: res.status, ok: res.ok });
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			console.error('❌ fetch 실패:', err);
			throw new Error(err?.error || '기록 저장에 실패했습니다.');
		}
		const { record } = await res.json();
		console.log('✅ saveConversationRecord 성공:', record);
		return record;
	} catch (error) {
		console.error('❌ saveConversationRecord 에러:', error?.message || error);
		throw error;
	}
}

/**
 * 대화 기록 조회
 * API 라우트(/api/conversations/records)를 fetch로 호출
 * @param {string} sessionId - 세션 ID
 * @param {string} userId - 사용자 ID (호환용, API는 토큰으로 사용자 식별)
 * @returns {Promise<Array>} 기록 목록
 */
export async function getConversationRecords(sessionId, userId) {
	try {
		console.log('📡 getConversationRecords 시작', { sessionId, userId });
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			console.log('❌ getConversationRecords: access_token 없음');
			return [];
		}
		console.log('📡 fetch 시작: /api/conversations/records');
		const res = await fetch(`/api/conversations/records?session_id=${sessionId}`, {
			headers: { Authorization: `Bearer ${currentSession.access_token}` }
		});
		console.log('📡 fetch 응답:', { status: res.status, ok: res.ok });
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			console.error('❌ fetch 실패:', err);
			throw new Error(err?.error || '기록 조회에 실패했습니다.');
		}
		const responseData = await res.json();
		console.log('📡 API 응답 데이터:', responseData);
		const { records } = responseData;
		console.log('✅ getConversationRecords 성공:', { recordCount: records?.length || 0 });
		return Array.isArray(records) ? records : [];
	} catch (error) {
		console.error('❌ getConversationRecords 에러:', error?.message || error);
		throw error;
	}
}

/**
 * 오디오 파일을 Supabase Storage에 업로드
 * @param {Blob} audioBlob - 오디오 Blob
 * @param {string} path - 저장 경로
 * @returns {Promise<string>} 업로드된 파일의 공개 URL
 */
export async function uploadAudioToStorage(audioBlob, path) {
	try {
		const { data, error } = await supabase.storage
			.from('audio')
			.upload(path, audioBlob, {
				contentType: audioBlob.type,
				upsert: false
			});

		if (error) {
			console.error('오디오 업로드 에러:', error);
			throw new Error('오디오 업로드에 실패했습니다.');
		}

		// 공개 URL 가져오기
		const { data: urlData } = supabase.storage
			.from('audio')
			.getPublicUrl(data.path);

		return urlData.publicUrl;
	} catch (error) {
		console.error('uploadAudioToStorage 에러:', error);
		throw error;
	}
}
