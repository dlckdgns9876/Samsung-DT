import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        login_id: '',
        email: '',
        password: '',
        nickname: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw data;

            alert('회원가입에 성공했습니다! 로그인 페이지로 이동합니다.');
            navigate('/login');
        } catch (err) {
            setError(err.msg || '회원가입 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="card" style={{ maxWidth: '480px', margin: 'auto' }}>
            <div className="card-body">
                <h2 className="card-title fs-4 mb-3">회원가입</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="login_id" className="form-label">아이디</label>
                        <input type="text" className="input" id="login_id" onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">이메일</label>
                        <input type="email" className="input" id="email" onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">비밀번호</label>
                        <input type="password" className="input" id="password" onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="nickname" className="form-label">닉네임</label>
                        <input type="text" className="input" id="nickname" onChange={handleChange} required />
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <button type="submit" className="btn primary w-100">가입</button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;