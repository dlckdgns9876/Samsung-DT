import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { AuthContext } from './AuthContext.jsx';
import { synthesizeApi, uploadProfileApi } from './lib/api.js';
import ScriptPanel from './ScriptPanel.jsx';
import TtsControlPanel from './TtsControlPanel.jsx';
import StoryPanel from './StoryPanel.jsx';

const TtsPage = () => {
    const { setGlobalAudio } = useContext(AuthContext);
    // TTS 합성 상태
    const [ttsState, setTtsState] = useState({
        engine: 'xtts',
        language: 'ko',
        userId: '',
        text: '',
    });
    const [audioUrl, setAudioUrl] = useState('');
    const [responseJson, setResponseJson] = useState('');
    const [uploadMessage, setUploadMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const playerRef = useRef(null);

    const handleSynthesize = useCallback(async () => {
        const payload = {
            ...ttsState,
            userId: ttsState.userId.trim(),
            text: ttsState.text.trim()
        };
        setResponseJson('');
        const result = await synthesizeApi('http://localhost:8000/tts/synthesize', payload);
        if (result.success) {
            setResponseJson(JSON.stringify(result.data, null, 2));
            if (result.data.audioUrl) {
                const serverOrigin = 'http://localhost:8000';
                const fullAudioUrl = `${serverOrigin}${result.data.audioUrl}`;
                setAudioUrl(fullAudioUrl);
                setGlobalAudio(fullAudioUrl, payload.text.substring(0, 20)); // 제목은 텍스트의 앞 20자로 설정
            }
        } else {
            setResponseJson(`합성 오류: ${result.message}`);
        }
    }, [ttsState]);

    useEffect(() => {
        if (audioUrl && playerRef.current) {
            playerRef.current.play().catch(() => {});
        }
    }, [audioUrl]);

    const handleClear = useCallback(() => {
        setTtsState(prev => ({ ...prev, text: '' }));
        setAudioUrl('');
        setResponseJson('');
        if (playerRef.current) {
            playerRef.current.removeAttribute('src');
        }
    }, []);

    const handleStorySelect = useCallback((storyText) => {
        setTtsState(prev => ({ ...prev, text: storyText }));
    }, []);

    const handleProfileUpload = useCallback(async (userId, file) => {
        if (!userId || !file) {
            setUploadMessage('userid와 파일을 선택하세요.');
            return;
        }
        setIsUploading(true);
        setUploadMessage('업로드 중...');
        // const result = await uploadProfileApi('/api/voice-profiles/upload', userId, file);
        const result = await uploadProfileApi('http://localhost:8000/voice-profiles/upload', userId, file);
        console.log(result);
        
        setUploadMessage(result.message);
        if (result.success) {
            // 업로드 성공 시 TTS Control Panel의 userId를 업데이트
            setTtsState(prev => ({ ...prev, userId }));
        }
        setIsUploading(false);
    }, []);


    return (
        <>
            <div className="row" style={{ justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <h1>AI Voice TTS Demo <span className="muted" style={{ fontWeight: 400 }}>/ KSS · XTTS</span></h1>
            </div>

            <div className="grid">
                {/* LEFT: 녹음 스크립트 패널 */}
                <ScriptPanel />

                {/* CENTER: 합성/업로드 */}
                <TtsControlPanel
                    ttsState={ttsState}
                    onTtsStateChange={setTtsState}
                    onSynthesize={handleSynthesize}
                    onClear={handleClear}
                    audioUrl={audioUrl}
                    responseJson={responseJson}
                    playerRef={playerRef}
                    onProfileUpload={handleProfileUpload}
                    uploadMessage={uploadMessage}
                    isUploading={isUploading}
                />

                {/* RIGHT: 테마별 동화 선택 */}
                <StoryPanel onStorySelect={handleStorySelect} />
            </div>
        </>
    );
};

export default TtsPage;
