import { useEffect, useMemo, useState, useContext } from "react";
import { AuthContext } from './AuthContext.jsx';
import "@/styles/tokens.css";
import "@/styles/ui.css";
import "@/styles/community.css";

import SearchBar from "./SearchBar";
import FilterTabs from "./FilterTabs";
import PostCard from "./PostCard";
import Pagination from "./Pagination";
import Modal from "./Modal";
import QuestionForm from "./QuestionForm";

const PAGE_SIZE = 10;

const fmt = (dStr) => {
    const d = new Date(dStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const HH = String(d.getHours()).padStart(2, "0");
    const MM = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${HH}:${MM}`;
};

export default function CommunityPage() {
    const { token } = useContext(AuthContext);
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState({});
    
    const [openCreate, setOpenCreate] = useState(false);
    const [expertMode, setExpertMode] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selected, setSelected] = useState(null);
    
    const [order, setOrder] = useState({ type: 'latest', dir: 'desc' });
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);

    const [commentDraft, setCommentDraft] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentDraft, setEditingCommentDraft] = useState("");
    const [editDraft, setEditDraft] = useState({ title: "", tags: "", content: "", isExpert: false });

    const fetchPosts = async () => {
        try {
            const res = await fetch(`/api/posts?orderBy=${order.type}&direction=${order.dir}`);
            const data = await res.json();
            if (res.ok) {
                setPosts(data);
            }
        } catch (err) {
            console.error("Failed to fetch posts", err);
        }
    };

    const fetchComments = async (postId) => {
        try {
            const res = await fetch(`/api/comments/${postId}`);
            const data = await res.json();
            if (res.ok) {
                setComments(prev => ({ ...prev, [postId]: data }));
            }
        } catch (err) {
            console.error("Failed to fetch comments", err);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [order]);

    useEffect(() => {
        if (selected) {
            fetchComments(selected.post_id);
        }
    }, [selected]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return posts;
        return posts.filter((p) => p.title.toLowerCase().includes(q));
    }, [posts, query]);
    
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    const handlePrev = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));
    const handlePage = (n) => setPage(n);

    const openPost = async (post) => {
        try {
            const res = await fetch(`/api/posts/${post.post_id}`);
            const data = await res.json();
            if (res.ok) {
                setSelected(data);
                setCommentDraft("");
                setEditingCommentId(null);
                setOpenView(true);
                // 목록의 조회수도 즉시 업데이트
                setPosts(prevPosts => prevPosts.map(p => 
                    p.post_id === post.post_id ? { ...p, view_count: data.view_count } : p
                ));
            }
        } catch (err) {
            console.error("Failed to fetch post details", err);
        }
    };

    const handleCreate = async (formData) => {
        const tags = String(formData.tags || "")
            .split(/[,\s]+/)
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t) => (t.startsWith("#") ? t : `#${t}`)).join(' ');
        
        const title = expertMode ? `[전문가] ${formData.title}` : formData.title;

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ title, content: formData.content, hashtag: tags }),
            });
            if (res.ok) {
                fetchPosts();
                setOpenCreate(false);
                setExpertMode(false);
                setPage(1);
            }
        } catch (err) {
            console.error("Failed to create post", err);
        }
    };

    const startEdit = () => {
        if (!selected) return;
        setEditDraft({ title: selected.title.replace('[전문가] ', ''), content: selected.content, tags: (selected.tags || []).join(' '), isExpert: selected.title.startsWith('[전문가]') });
        setOpenEdit(true);
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!selected) return;
        const tags = String(editDraft.tags || "")
            .split(/[,\s]+/)
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t) => (t.startsWith("#") ? t : `#${t}`)).join(' ');
        
        const title = editDraft.isExpert ? `[전문가] ${editDraft.title}` : editDraft.title;

        try {
            const res = await fetch(`/api/posts/${selected.post_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ ...editDraft, title, hashtag: tags }),
            });
            if (res.ok) {
                fetchPosts();
                setOpenEdit(false);
                setSelected(prev => ({...prev, title, content: editDraft.content, tags: editDraft.tags.split(' ') }));
            }
        } catch (err) {
            console.error("Failed to update post", err);
        }
    };

    const deletePost = async () => {
        if (!selected) return;
        if (!confirm("이 글을 삭제하시겠어요?")) return;
        try {
            const res = await fetch(`/api/posts/${selected.post_id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token },
            });
            if (res.ok) {
                fetchPosts();
                setOpenView(false);
                setSelected(null);
            }
        } catch (err) {
            console.error("Failed to delete post", err);
        }
    };

    const submitComment = async (e) => {
        e.preventDefault();
        const content = commentDraft.trim();
        if (!selected || !content) return;
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ post_id: selected.post_id, content }),
            });
            if (res.ok) {
                fetchComments(selected.post_id);
                setCommentDraft("");
            }
        } catch (err) {
            console.error("Failed to create comment", err);
        }
    };
    
    // ... (댓글 수정/삭제 로직은 생략, 필요시 추가 구현)

    const commentsOfSelected = selected ? comments[selected.post_id] || [] : [];

    return (
        <main className="main-offset">
            <div className="container community-wrap">
                <div className="panel pad section">
                    <div className="community-header">
                        <div className="community-title">커뮤니티 & QnA</div>
                        <div className="actions">
                            <button className="btn outline pill" onClick={() => { setExpertMode(false); setOpenCreate(true); }}>질문하기</button>
                            <button className="btn pill" onClick={() => { setExpertMode(true); setOpenCreate(true); }}>전문가</button>
                        </div>
                    </div>
                    <div className="toolbar">
                        <SearchBar value={query} onChange={setQuery} />
                        <FilterTabs order={order} setOrder={setOrder} />
                    </div>
                </div>

                {pageItems.length === 0 ? (
                    <div className="panel pad" style={{ textAlign: "center", color: "var(--muted)" }}>
                        게시글이 없습니다.
                    </div>
                ) : (
                    <div className="grid-2">
                        {pageItems.map((p) => (
                            <PostCard key={p.post_id} post={{...p, date: fmt(p.created_at)}} onOpen={openPost} />
                        ))}
                    </div>
                )}

                <Pagination total={totalPages} page={page} onPrev={handlePrev} onNext={handleNext} onPage={handlePage} />

                <Modal open={openCreate} onClose={() => { setOpenCreate(false); setExpertMode(false); }} title={expertMode ? "전문가 글 작성" : "질문 작성"}>
                    <QuestionForm mode={expertMode ? "expert" : "user"} onSubmit={handleCreate} onCancel={() => { setOpenCreate(false); setExpertMode(false); }} />
                </Modal>

                <Modal open={openView} onClose={() => setOpenView(false)} title={selected ? selected.title.replace('[전문가] ', '') : "질문 상세"}>
                    {selected && (
                        <div>
                            <div className="detail-actions">
                                <button className="btn outline sm" onClick={startEdit}>수정</button>
                                <button className="btn ghost sm" onClick={deletePost}>삭제</button>
                            </div>
                            {selected.title.startsWith('[전문가]') && <span className="expert-badge">🧑‍⚕️ 전문가</span>}
                            <div className="meta" style={{ margin: "8px 0 12px" }}>{fmt(selected.created_at)} · {selected.nickname} · 조회 {selected.view_count || 0}</div>
                            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, marginBottom: 16 }}>{selected.content}</div>
                            <div className="comments">
                                <div className="comments-header">댓글 {commentsOfSelected.length}</div>
                                <ul className="comment-list">
                                    {commentsOfSelected.map((c) => (
                                        <li key={c.comment_id} className="comment-item">
                                            <div className="comment-text">{c.content}</div>
                                            <div className="comment-meta">{fmt(c.created_at)} · {c.nickname}</div>
                                        </li>
                                    ))}
                                    {commentsOfSelected.length === 0 && (<li className="comment-empty">첫 댓글을 남겨보세요.</li>)}
                                </ul>
                                <form className="comment-form" onSubmit={submitComment}>
                                    <textarea className="textarea" placeholder="댓글을 입력하세요" value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} />
                                    <div className="comment-actions">
                                        <button type="submit" className="btn pill">등록</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </Modal>

                <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="글 수정">
                    <form className="edit-form" onSubmit={saveEdit}>
                        <label className="label">제목</label>
                        <input className="input" value={editDraft.title} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} placeholder="제목을 입력하세요" />
                        <label className="label">태그</label>
                        <input className="input" value={editDraft.tags} onChange={(e) => setEditDraft((d) => ({ ...d, tags: e.target.value }))} placeholder="#태그1 #태그2" />
                        <label className="label">내용</label>
                        <textarea className="textarea" value={editDraft.content} onChange={(e) => setEditDraft((d) => ({ ...d, content: e.target.value }))} placeholder="내용을 입력하세요" />
                        <label className="row-left" style={{ gap: 8 }}>
                            <input type="checkbox" checked={editDraft.isExpert} onChange={(e) => setEditDraft((d) => ({ ...d, isExpert: e.target.checked }))} />
                            전문가 글로 표시
                        </label>
                        <div className="row-right">
                            <button type="submit" className="btn pill">저장</button>
                            <button type="button" className="btn outline pill" onClick={() => setOpenEdit(false)}>취소</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </main>
    );
}
