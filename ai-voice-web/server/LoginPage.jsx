import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './AuthContext.jsx';

const LoginPage = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // 카카오 로그인 URL 생성
    const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY; // .env 파일에서 키를 불러옵니다.
    // console.log(KAKAO_REST_API_KEY);
    
    const redirectUri = `${window.location.origin}/kakao/callback`; // 프록시가 아닌 프론트엔드 라우트 경로로 변경
    const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${redirectUri}&response_type=code`;
    // const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?client_id=7d34118f4498bbd5f47ea0804d89ef21&redirect_uri=${redirectUri}&response_type=code`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login_id: loginId, password }),
            });
            const data = await res.json();
            if (!res.ok) throw data;

            login(data.token, data.user.nickname, 'local');
            alert(`${data.user.nickname}님, 환영합니다!`);
            navigate('/');
        } catch (err) {
            setError(err.msg || '아이디 또는 비밀번호를 확인하세요.');
        }
    };

    return (
        <div className="card" style={{ maxWidth: '480px', margin: 'auto' }}>
            <div className="card-body">
                <h2 className="card-title fs-4 mb-3 text-center">로그인</h2>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                        <div className="mb-3">
                            <label htmlFor="loginId" className="form-label">아이디</label>
                            <input type="text" className="input" id="loginId" value={loginId} onChange={(e) => setLoginId(e.target.value)} required autoComplete="username" />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="loginPassword" className="form-label">비밀번호</label>
                            <input type="password" className="input" id="loginPassword" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                        </div>
                        {error && <div className="alert alert-danger">{error}</div>} <br />
                        <button type="submit" className="btn primary w-100">로그인</button>
                    </form>

                    <div className="d-flex justify-content-center align-items-center w-100" style={{ gap: '1rem' }}>
                        <a href={kakaoLoginUrl}>
                            <img src="/kakao_login.png" alt="카카오 로그인 버튼" style={{ height: '45px', width: 'auto' }} />
                        </a>
                        <a href="#"><img src="/naver_login.png" alt="네이버 로그인 버튼" style={{height: '45px', width: 'auto'}}/></a>
                        <a href="#"><img src="/google_login.png" alt="구글 로그인 버튼" style={{height: '45px', width: 'auto'}}/></a>
                        <a href="#"><img src="/apple_login.png" alt="애플 로그인 버튼" style={{height: '45px', width: 'auto'}}/></a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
