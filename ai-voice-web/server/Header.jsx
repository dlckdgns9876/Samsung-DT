import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = () => {
    return (
        <header className="header">
            <div className="container header-inner">
                <a className="brand" href="/">초보 육아 웹</a>
                <nav className="nav">
                    <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>홈</NavLink>
                    <NavLink to="/tts" className={({ isActive }) => isActive ? 'active' : ''}>동화</NavLink>

                    {/* 홈 내부 섹션은 앵커만 유지 */}
                    <a href="/#behaviors">행동사전</a>
                    <a href="/#routines">루틴</a>

                    <NavLink to="/growth" className={({ isActive }) => isActive ? 'active' : ''}>성장/건강</NavLink>
                    <a href="/#community">커뮤니티</a>
                </nav>
            </div>
        </header>
    );
};

export default Header;