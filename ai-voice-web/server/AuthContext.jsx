import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        token: localStorage.getItem('token'),
        nickname: localStorage.getItem('nickname'),
        loginType: localStorage.getItem('login_type'),
    });
    const [audioInfo, setAudioInfo] = useState({
        url: null,
        title: null,
    });

    const setGlobalAudio = useCallback((url, title) => {
        setAudioInfo({ url, title });
    }, []);

    const login = useCallback((token, nickname, loginType) => {
        localStorage.setItem('token', token);
        localStorage.setItem('nickname', nickname);
        localStorage.setItem('login_type', loginType);
        setAuth({ token, nickname, loginType });
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('nickname');
        localStorage.removeItem('login_type');
        setAuth({ token: null, nickname: null, loginType: null });
        alert('로그아웃 되었습니다.');
    }, []);

    const updateNickname = useCallback((newNickname) => {
        localStorage.setItem('nickname', newNickname);
        setAuth(prevAuth => ({ ...prevAuth, nickname: newNickname }));
    }, []);

    // 페이지 로드 시 localStorage와 상태 동기화
    useEffect(() => {
        const token = localStorage.getItem('token');
        const nickname = localStorage.getItem('nickname');
        const loginType = localStorage.getItem('login_type');
        if (token && nickname) {
            setAuth({ token, nickname, loginType });
        }
    }, []);

    const value = {
        ...auth,
        ...audioInfo,
        isAuthenticated: !!auth.token,
        login,
        logout,
        updateNickname,
        setGlobalAudio,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
