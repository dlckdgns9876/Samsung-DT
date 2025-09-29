import React from 'react';

const PostCard = ({ post, onOpen }) => {
    const isExpert = post.title && post.title.startsWith('[전문가]');
    const displayTitle = isExpert ? post.title.substring(5) : post.title;

    return (
        <div className="panel pad clickable" onClick={() => onOpen(post)}>
            <div className="row-left">
                {isExpert && <span className="expert-badge-list">🧑‍⚕️ 전문가</span>}
                <div className="title" style={{ color: isExpert ? 'var(--brand)' : 'inherit' }}>{displayTitle}</div>
            </div>
            <div className="meta">
                {post.date} · {post.nickname} · 조회 {post.view_count || 0} · 추천 {post.likes || 0}
            </div>
            <div className="badges">
                {(post.tags || []).map((t) => (
                    <span className="badge" key={t}>{t}</span>
                ))}
            </div>
        </div>
    );
};

export default PostCard;
