import React, { useContext } from 'react';
import { Link, Outlet, useNavigate, NavLink } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Layout = () => {    
    const { isAuthenticated, nickname, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div>
            <header className="header">
                <div className="container header-inner">
                    <Link className="brand" to="/">초보 육아 웹</Link>
                    <nav className="nav">
                        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>홈</NavLink>
                        <NavLink to="/tts" className={({ isActive }) => isActive ? 'active' : ''}>AI 동화</NavLink>
                        {/* <a href="/#behaviors">행동사전</a> */}
                        {/* <a href="/#routines">루틴</a> */}
                        <NavLink to="/growth" className={({ isActive }) => isActive ? 'active' : ''}>성장/건강</NavLink>
                        <a href="/community">커뮤니티</a>
                    </nav>
                    <div className="auth">
                        {isAuthenticated ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{nickname}님</span>
                                <Link to="/mypage" className="btn ghost">마이페이지</Link>
                                <button onClick={handleLogout} className="btn">로그아웃</button>
                            </div>
                        ) : (
                            <><Link to="/login" className="btn ghost">로그인</Link><Link to="/register" className="btn primary">회원가입</Link></>
                        )}
                    </div>
                </div>
            </header>
            <main style={{ padding: '28px 20px 120px' }}>
                <Outlet />
            </main>
            <footer className="footer">
                <div className="container muted">© 2025 육아 도래(이) · All Rights Reserved.</div>
            </footer>
        </div>
    );
};

export default Layout;
