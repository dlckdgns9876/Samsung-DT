import React, { useState, useMemo } from 'react';
import { STORIES, THEMES } from './data.js';

const StoryPanel = ({ onStorySelect }) => {
    const [currentTheme, setCurrentTheme] = useState('전체');
    const [currentStory, setCurrentStory] = useState(STORIES[0]);

    const filteredStories = useMemo(() =>
        STORIES.filter(s => currentTheme === '전체' || s.theme === currentTheme),
        [currentTheme]
    );

    const handleSelectStory = (story) => {
        setCurrentStory(story);
    };

    return (
        <aside className="card col-right">
            <div className="story-head">
                <h3 style={{ margin: 0 }}>📚 테마별 동화</h3>
                <span className="muted" style={{ fontSize: '12px' }}>원본 창작 · 자유 이용</span>
            </div>
            <div className="seg" style={{ marginTop: '8px' }}>
                {THEMES.map(theme => (
                    <button key={theme} onClick={() => setCurrentTheme(theme)} className={`pill ${currentTheme === theme ? 'active' : ''}`}>{theme}</button>
                ))}
            </div>
            <div className="list">
                {filteredStories.map(story => (
                    <div key={story.id} className="row" style={{ justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--line)', borderRadius: '10px', padding: '10px 12px' }}>
                        <div><strong>{story.title}</strong> <span className="muted">· {story.theme}</span></div>
                        <div><button className="btn" onClick={() => handleSelectStory(story)}>보기</button></div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '12px' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong id="storyTitle">{currentStory?.title}</strong>
                    <div className="row" style={{ gap: '6px' }}>
                        <button className="btn" onClick={() => onStorySelect(currentStory?.text || '')}>텍스트 상자에 넣기</button>
                    </div>
                </div>
                <div className="box" style={{ marginTop: '8px', minHeight: '140px' }}>{currentStory?.text}</div>
            </div>
        </aside>
    );
};

export default StoryPanel;