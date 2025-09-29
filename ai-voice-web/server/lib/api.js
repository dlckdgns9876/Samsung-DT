/**
 * API 호출을 위한 기본 래퍼 함수
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<{success: boolean, data?: any, message: string}>}
 */
console.log('api');

async function fetchApi(url, options) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            // FastAPI의 HTTPException detail을 message로 사용
            throw new Error(data.detail || 'API 요청에 실패했습니다.');
        }
        // 성공 응답에 별도 메시지가 있으면 사용, 없으면 기본 메시지
        const successMessage = data.message || (data.ok ? '요청 성공' : '성공');
        return { success: true, data: data, message: successMessage };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * TTS 합성을 요청합니다.
 * @param {{text: string, engine: string, language: string, userId: string}} payload
 * @returns {Promise<{success: boolean, data?: any, message: string}>}
 */
// /tts/synthesize'
export function synthesizeApi(url, payload) {
    return fetchApi(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

/**
 * 음성 프로필을 업로드합니다.
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<{success: boolean, data?: any, message: string}>}
 */
// '/voice-profiles/upload'
export function uploadProfileApi(url, userId, file) {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('file', file);
    return fetchApi(url, { method: 'POST', body: formData });
}