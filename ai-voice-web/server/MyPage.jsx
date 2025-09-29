import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const MyPage = () => {
    const { token, loginType, updateNickname, isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    // 닉네임 변경
    const [newNickname, setNewNickname] = useState('');

    // 비밀번호 변경
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });

    // 아기 프로필 추가
    const [babyData, setBabyData] = useState({ name: '', birthdate: '', gender: '미정', blood_type: '', notes: '' });
    const [babyProfileImage, setBabyProfileImage] = useState(null);

    // 아기 정보 조회
    const [babies, setBabies] = useState([]);
    const [message, setMessage] = useState('');

    // 아기 정보 수정
    const [editingBaby, setEditingBaby] = useState(null);

    const fetchBabies = async () => {
        if (!token) return;

        try {
            const res = await fetch('/api/babies', {
                headers: { 'x-auth-token': token },
            });
            const data = await res.json();
            if (!res.ok) throw data;
            setBabies(data);
            if (data.length === 0) {
                setMessage('등록된 아기 정보가 없습니다. 아래에서 추가해주세요.');
            }
        } catch (err) {
            setMessage(`아기 정보 조회 실패: ${err.msg || '서버 오류'}`);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            alert('로그인이 필요한 페이지입니다.');
            navigate('/login');
        } else {
            fetchBabies();
        }
    }, [isAuthenticated, navigate, token]);

    const handleNicknameUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users/nickname', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ nickname: newNickname }),
            });
            const data = await res.json();
            if (!res.ok) throw data;

            updateNickname(data.nickname);
            alert('닉네임이 성공적으로 변경되었습니다.');
            setNewNickname('');
        } catch (err) {
            alert(`닉네임 변경 실패: ${err.msg || '서버 오류'}`);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(passwordData),
            });
            const data = await res.json();
            if (!res.ok) throw data;

            alert(data.msg);
            setPasswordData({ currentPassword: '', newPassword: '' });
        } catch (err) {
            alert(`비밀번호 변경 실패: ${err.msg || '서버 오류'}`);
        }
    };

    const handleAddBaby = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(babyData).forEach(key => formData.append(key, babyData[key]));
        if (babyProfileImage) {
            formData.append('profile_image', babyProfileImage);
        }

        try {
            const res = await fetch('/api/babies', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw data;

            alert('아기 정보가 성공적으로 추가되었습니다.');
            setBabyData({ name: '', birthdate: '', gender: '미정', blood_type: '', notes: '' });
            setBabyProfileImage(null);
            if (e.target.querySelector('input[type="file"]')) {
                e.target.querySelector('input[type="file"]').value = '';
            }
            fetchBabies();
        } catch (err) {
            alert(`아기 정보 추가 실패: ${err.msg || '서버 오류'}`);
        }
    };

    const handleUpdateBaby = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/babies/${editingBaby.baby_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(editingBaby),
            });
            const data = await res.json();
            if (!res.ok) throw data;

            alert('아기 정보가 성공적으로 수정되었습니다.');
            setEditingBaby(null);
            fetchBabies();
        } catch (err) {
            alert(`아기 정보 수정 실패: ${err.msg || '서버 오류'}`);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div style={{ maxWidth: '720px', margin: 'auto' }}>
            <h1 className="text-center mb-4">마이페이지</h1>

            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                    <h2 className="card-title fs-4 mb-3">내 아기 정보</h2>
                    <div className="table-responsive">
                        {babies.length > 0 ? (
                            <table className="record-table">
                                <thead>
                                    <tr>
                                        <th>프로필</th>
                                        <th>이름</th>
                                        <th>생년월일</th>
                                        <th>성별</th>
                                        <th>특이사항</th>
                                        <th>수정</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {babies.map(baby => (
                                        <tr key={baby.baby_id}>
                                            <td>
                                                {baby.profile_image_url ? (
                                                    <img src={baby.profile_image_url} alt={`${baby.name} 프로필`} className="rounded-circle" width="50" height="50" style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center" style={{ width: 50, height: 50, margin: 'auto' }}>
                                                        <span className="text-white small">사진없음</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td>{baby.name}</td>
                                            <td>{new Date(baby.birthdate).toISOString().split('T')[0]}</td>
                                            <td>{baby.gender}</td>
                                            <td>{baby.notes}</td>
                                            <td><button className="btn" onClick={() => setEditingBaby(baby)}>수정</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center text-muted">{message || '로딩 중...'}</div>
                        )}
                    </div>
                </div>
            </div>

            {editingBaby && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <div className="card-body">
                        <h2 className="card-title fs-4 mb-3">아기 정보 수정</h2>
                        <form onSubmit={handleUpdateBaby}>
                            <div className="mb-3"><label htmlFor="editBabyName" className="form-label">아기 이름</label><input type="text" className="input" id="editBabyName" value={editingBaby.name} onChange={e => setEditingBaby({...editingBaby, name: e.target.value})} required /></div>
                            <div className="mb-3"><label htmlFor="editBabyBirthDate" className="form-label">생년월일</label><input type="date" className="input" id="editBabyBirthDate" value={new Date(editingBaby.birthdate).toISOString().split('T')[0]} onChange={e => setEditingBaby({...editingBaby, birthdate: e.target.value})} required /></div>
                            <div className="mb-3"><label htmlFor="editBabyGender" className="form-label">성별</label><select className="input" id="editBabyGender" value={editingBaby.gender} onChange={e => setEditingBaby({...editingBaby, gender: e.target.value})}><option value="미정">미정</option><option value="남아">남아</option><option value="여아">여아</option></select></div>
                            <div className="mb-3"><label htmlFor="editBabyBloodType" className="form-label">혈액형</label><input type="text" className="input" id="editBabyBloodType" placeholder="예: A+" value={editingBaby.blood_type} onChange={e => setEditingBaby({...editingBaby, blood_type: e.target.value})} /></div>
                            <div className="mb-3"><label htmlFor="editBabyNotes" className="form-label">특이사항</label><textarea className="input" id="editBabyNotes" rows="3" value={editingBaby.notes} onChange={e => setEditingBaby({...editingBaby, notes: e.target.value})}></textarea></div>
                            <div className="row">
                                <button type="submit" className="btn primary" style={{flex: 1}}>저장</button>
                                <button type="button" className="btn" onClick={() => setEditingBaby(null)}>취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                    <h2 className="card-title fs-4 mb-3">회원정보 수정</h2>
                    <form onSubmit={handleNicknameUpdate} className="mb-4">
                        <label htmlFor="newNickname" className="form-label">새 닉네임</label>
                        <div className="input-group">
                            <input type="text" id="newNickname" className="input" placeholder="새 닉네임을 입력하세요" value={newNickname} onChange={e => setNewNickname(e.target.value)} required />
                            <button className="btn btn-outline-primary" type="submit">변경</button>
                        </div>
                    </form>

                    {loginType !== 'kakao' && (
                        <form onSubmit={handlePasswordUpdate}>
                            <div className="mb-3">
                                <label htmlFor="currentPassword" className="form-label">현재 비밀번호</label>
                                <input type="password" id="currentPassword" className="input" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} required />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="newPassword" className="form-label">새 비밀번호</label>
                                <input type="password" id="newPassword" className="input" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required />
                            </div>
                            <button type="submit" className="btn btn-outline-danger w-100">비밀번호 변경</button>
                        </form>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    <h2 className="card-title fs-4 mb-3">아기 프로필 추가</h2>
                    <form onSubmit={handleAddBaby}>
                        <div className="mb-3"><label htmlFor="babyName" className="form-label">아기 이름</label><input type="text" className="input" id="babyName" value={babyData.name} onChange={e => setBabyData({...babyData, name: e.target.value})} required /></div>
                        <div className="mb-3"><label htmlFor="babyBirthDate" className="form-label">생년월일</label><input type="date" className="input" id="babyBirthDate" value={babyData.birthdate} onChange={e => setBabyData({...babyData, birthdate: e.target.value})} required /></div>
                        <div className="mb-3"><label htmlFor="babyGender" className="form-label">성별</label><select className="input" id="babyGender" value={babyData.gender} onChange={e => setBabyData({...babyData, gender: e.target.value})}><option value="미정">미정</option><option value="남아">남아</option><option value="여아">여아</option></select></div>
                        <div className="mb-3"><label htmlFor="babyBloodType" className="form-label">혈액형</label><input type="text" className="input" id="babyBloodType" placeholder="예: A+" value={babyData.blood_type} onChange={e => setBabyData({...babyData, blood_type: e.target.value})} /></div>
                        <div className="mb-3"><label htmlFor="babyNotes" className="form-label">특이사항</label><textarea className="input" id="babyNotes" rows="3" value={babyData.notes} onChange={e => setBabyData({...babyData, notes: e.target.value})}></textarea></div>
                        <div className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label htmlFor="babyProfileImage" className="form-label" style={{ marginBottom: 0 }}>프로필 사진</label>
                            <div className="file-input-wrapper">
                                <input type="file" id="babyProfileImage" accept="image/*" onChange={e => setBabyProfileImage(e.target.files[0])} style={{ display: 'none' }} />
                                <label htmlFor="babyProfileImage" className="btn">파일 선택</label>
                                {babyProfileImage && <span style={{ marginLeft: '12px' }}>{babyProfileImage.name}</span>}
                            </div>
                        </div>
                        <button type="submit" className="btn btn-info w-100 text-white">추가</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MyPage;
