import React, { useState } from 'react';

const TtsControlPanel = ({
    ttsState, onTtsStateChange,
    onSynthesize, onClear,
    audioUrl, responseJson, playerRef,
    onProfileUpload, uploadMessage, isUploading
}) => {
    const [uploadUserId, setUploadUserId] = useState('');
    const [uploadFile, setUploadFile] = useState(null);

    const handleUpload = async () => {
        onProfileUpload(uploadUserId.trim(), uploadFile);
    };

    // 업로드 성공 시, 부모가 전달한 ttsState.userId가 변경되므로
    // uploadUserId 필드도 동기화해주는 것이 사용자 경험에 좋습니다.
    React.useEffect(() => {
        setUploadUserId(ttsState.userId);
    }, [ttsState.userId]);

    return (
        <main className="card col-center">
            <div className="row" style={{ gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px' }}><label htmlFor="engine">엔진</label><select id="engine" value={ttsState.engine} onChange={e => onTtsStateChange({ ...ttsState, engine: e.target.value })}><option value="xtts">xtts (다국어, 보이스 프로필 필요)</option><option value="kss" disabled>kss (단일 화자, 프로필 불필요) – 비활성</option></select></div>
                <div style={{ flex: '1 1 220px' }}><label htmlFor="language">언어</label><select id="language" value={ttsState.language} onChange={e => onTtsStateChange({ ...ttsState, language: e.target.value })}><option value="ko">ko (Korean)</option><option value="en">en (English)</option></select></div>
            </div>
            <label htmlFor="userId">userid (XTTS 전용)</label>
            <input id="userId" placeholder="예: user1" value={ttsState.userId} onChange={e => onTtsStateChange({ ...ttsState, userId: e.target.value })} />
            <label htmlFor="text" style={{ marginTop: '12px' }}>텍스트</label>
            <textarea id="text" placeholder="예) 오늘은 어떤 모험을 떠나 볼까요?" value={ttsState.text} onChange={e => onTtsStateChange({ ...ttsState, text: e.target.value })}></textarea>
            <div className="row" style={{ marginTop: '12px' }}>
                <button onClick={onSynthesize} className="btn primary" style={{ flex: 1 }}>합성하기</button>
                <button onClick={onClear} className="btn">초기화</button>
            </div>
            <audio ref={playerRef} src={audioUrl} className="player" controls></audio>
            {responseJson && <pre className="json" style={{ marginTop: '12px' }}>{responseJson}</pre>}
            <hr style={{ margin: '18px 0', border: 'none', borderTop: '1px solid var(--line)' }} />
            <h3 style={{ margin: '0 0 8px' }}>보이스 프로필 업로드 (XTTS용)</h3>
            <div className="row" style={{ gap: '12px', flexWrap: 'wrap' }}><div style={{ flex: '1 1 220px' }}><label htmlFor="upUser">userid</label><input id="upUser" placeholder="예: user1" value={uploadUserId} onChange={e => setUploadUserId(e.target.value)} /></div><div style={{ flex: '1 1 220px' }}><label htmlFor="upFile">speaker wav</label><input id="upFile" type="file" accept=".wav,.mp3,.m4a,.aac,.flac,.ogg" onChange={e => setUploadFile(e.target.files[0])} /></div></div>
            <button onClick={handleUpload} className="btn primary" style={{ marginTop: '10px' }} disabled={isUploading}>{isUploading ? '업로드 중...' : '프로필 업로드'}</button>
            <div className="muted" style={{ marginTop: '8px' }}>{uploadMessage}</div>
        </main>
    );
};

export default TtsControlPanel;
