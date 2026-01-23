/**
 * 프롬프트 설정을 기반으로 시스템 프롬프트 생성
 * @param {Object} settings - 프롬프트 설정
 * @param {string} settings.mode - 프롬프트 모드 ('preset' or 'custom')
 * @param {string} settings.tone - 대화 톤 (warm, formal, casual, friendly)
 * @param {string} settings.correctionStyle - 실수 교정 방식 (gently, strictly, never)
 * @param {string} settings.responseLength - 응답 길이 (concise, medium, detailed)
 * @param {string} settings.conversationStyle - 대화 스타일 (natural, structured, free-form)
 * @param {string} settings.customPrompt - 커스텀 프롬프트 (mode가 'custom'일 때 사용)
 * @returns {string} 생성된 시스템 프롬프트
 */
export function generatePrompt(settings = {}) {
	const {
		mode = 'preset',
		tone = 'warm',
		correctionStyle = 'gently',
		responseLength = 'concise',
		conversationStyle = 'natural',
		customPrompt = ''
	} = settings;

	// 커스텀 프롬프트 모드인 경우 커스텀 프롬프트 반환
	if (mode === 'custom' && customPrompt && customPrompt.trim()) {
		return customPrompt.trim();
	}

	// 톤 설명
	const toneDescriptions = {
		warm: '따뜻하고 격려하는 톤으로',
		formal: '정중하고 격식 있는 톤으로',
		casual: '편안하고 캐주얼한 톤으로',
		friendly: '친근하고 활발한 톤으로'
	};

	// 교정 방식 설명
	const correctionDescriptions = {
		gently: '부드럽게 실수를 지적하고 교정합니다',
		strictly: '명확하게 실수를 지적하고 교정합니다',
		never: '실수를 지적하지 않고 자연스럽게 대화를 이어갑니다'
	};

	// 응답 길이 설명
	const responseLengthDescriptions = {
		concise: '짧고 간결한 응답을 제공합니다',
		medium: '적당한 길이의 응답을 제공합니다',
		detailed: '자세하고 긴 응답을 제공합니다'
	};

	// 대화 스타일 설명
	const conversationStyleDescriptions = {
		natural: '자연스럽고 자유로운 대화를 이어갑니다',
		structured: '주제를 정하고 구조화된 대화를 진행합니다',
		'free-form': '완전히 자유로운 주제로 대화합니다'
	};

	const prompt = `You are a friendly and patient English conversation tutor. Your role is to:
1. Help users practice English conversation
2. Provide natural, conversational responses
3. ${correctionDescriptions[correctionStyle]}
4. Encourage users to speak more
5. Ask follow-up questions to keep the conversation flowing
6. ${toneDescriptions[tone]} speak

${responseLengthDescriptions[responseLength]}. ${conversationStyleDescriptions[conversationStyle]}.

Keep your responses ${responseLength === 'concise' ? 'concise and natural' : responseLength === 'medium' ? 'moderate in length and natural' : 'detailed and comprehensive'}, as if you're having a real conversation.`;

	return prompt;
}
