import React, { useState, useCallback } from 'react';
import './ScriptPanel.css';
import { SCRIPTS } from './data.js';

const ScriptPanel = () => {
    const [scriptKey, setScriptKey] = useState('s30');
    const [copyButtonText, setCopyButtonText] = useState('복사');

    const handleCopyScript = useCallback(async () => {
        await navigator.clipboard.writeText(SCRIPTS[scriptKey]);
        setCopyButtonText('복사됨!');
        setTimeout(() => setCopyButtonText('복사'), 1200);
    }, [scriptKey]);

    return (
        <aside className="card col-left">
            <h3 style={{ margin: '0 0 6px' }}>🎙️ 녹음 스크립트</h3>
            <div className="muted" style={{ marginBottom: '10px' }}>동화 톤으로 30/60/90초 버전을 선택해 그대로 읽어 주세요.</div>
            <div className="seg">
                {Object.keys(SCRIPTS).map(key => (
                    <button key={key} onClick={() => setScriptKey(key)} className={scriptKey === key ? 'active' : ''}>{key.replace('s', '')}초</button>
                ))}
            </div>
            <div id="scriptBox" className="box">{SCRIPTS[scriptKey]}</div>
            <div className="actions"><button onClick={handleCopyScript} className="btn">{copyButtonText}</button></div>
        </aside>
    );
};

export default ScriptPanel;