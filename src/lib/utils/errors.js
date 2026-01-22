/**
 * 마이크 관련 에러 메시지 생성
 */
export function getMicrophoneErrorMessage(error) {
	if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
		return '마이크 접근이 거부되었습니다. 브라우저 주소창의 자물쇠 아이콘을 클릭하여 마이크 권한을 허용해주세요.';
	} else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
		return '마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.';
	} else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
		return '마이크가 다른 프로그램에서 사용 중입니다. 다른 프로그램을 종료하고 다시 시도해주세요.';
	} else if (error.name === 'OverconstrainedError') {
		return '요청한 마이크 설정을 지원하지 않습니다.';
	} else if (error.message) {
		return `마이크 접근 오류: ${error.message}`;
	}
	return '마이크 접근 권한이 필요합니다.';
}
