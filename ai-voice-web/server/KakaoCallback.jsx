import React, { useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext.jsx';

const KakaoCallback = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code'); // URL에서 인가 코드 가져오기

        const handleKakaoLogin = async (authCode) => {
            try {
                const res = await fetch(`/api/auth/kakao/callback?code=${authCode}`);
                const data = await res.json();
                if (!res.ok) throw data;

                login(data.token, data.user.nickname, 'kakao');
                alert(`${data.user.nickname}님, 환영합니다!`);
                navigate('/');
            } catch (err) {
                alert(`카카오 로그인 실패: ${err.msg || '서버 오류'}`);
                navigate('/login');
            }
        }

        if (code) {
            handleKakaoLogin(code);
        } else {
            // 코드가 없는 경우 (잘못된 접근)
            alert('잘못된 접근입니다.');
            navigate('/login');
        }
    }, [location, navigate, login]); // 의존성 배열은 그대로 유지

    return <div>카카오 로그인 처리 중...</div>;
};

export default KakaoCallback;
