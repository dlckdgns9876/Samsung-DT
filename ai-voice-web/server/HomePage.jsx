import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './AuthContext.jsx';
import './base.css';
import './components.css';
import './tokens.css';

const HomePage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, token, url: audioUrl, title: audioTitle } = useContext(AuthContext);
    const [babies, setBabies] = useState([]);
    const [alarms, setAlarms] = useState([]);
    const [alarmTitle, setAlarmTitle] = useState('');
    const [alarmDate, setAlarmDate] = useState('');
    const [alarmTime, setAlarmTime] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const playerRef = useRef(null);
    const [growthRecords, setGrowthRecords] = useState([]);
    const growthChartRef = useRef(null);
    const [posts, setPosts] = useState([]);

    // --- 알람 로직 시작 ---
    const fetchAlarms = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/alarms', { headers: { 'x-auth-token': token } });
            const data = await res.json();
            if (res.ok) setAlarms(data.map(a => ({...a, pinned: false }))); // pinned 상태 추가
        } catch (err) {
            console.error('Failed to fetch alarms:', err);
        }
    };

    useEffect(() => {
        Notification.requestPermission();
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        setAlarmDate(`${year}-${month}-${day}`);
        setAlarmTime(`${hours}:${minutes}`);
        if (isAuthenticated) {
            fetchAlarms();
        }
    }, [isAuthenticated, token]);

    const rescheduleAlarm = async (alarm) => {
        const currentAlarmTime = new Date(alarm.alarm_time.replace(' ', 'T'));
        currentAlarmTime.setDate(currentAlarmTime.getDate() + 1);
        const new_alarm_time = currentAlarmTime.toISOString().slice(0, 19).replace('T', ' ');

        try {
            await fetch(`/api/alarms/${alarm.alarm_id}/reschedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ new_alarm_time })
            });
            fetchAlarms();
        } catch (err) {
            console.error('Error rescheduling alarm:', err);
        }
    };

    useEffect(() => {
        const timeouts = alarms.map(alarm => {
            const alarmTime = new Date(alarm.alarm_time.replace(' ', 'T'));
            const now = new Date();
            const timeout = alarmTime.getTime() - now.getTime();
            if (timeout > 0) {
                return setTimeout(() => {
                    new Notification(alarm.title, { body: `설정한 시간입니다: ${alarm.alarm_time}` });
                    if (alarm.pinned) {
                        rescheduleAlarm(alarm);
                    } else {
                        deactivateAlarm(alarm.alarm_id);
                    }
                }, timeout);
            }
            return null;
        });

        return () => timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    }, [alarms]);

    const addAlarm = async () => {
        if (!alarmDate || !alarmTime) return alert("날짜와 시간을 모두 선택하세요.");
        const title = alarmTitle.trim() || "알림";
        
        try {
            const res = await fetch('/api/alarms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ title, date: alarmDate, time: alarmTime }),
            });
            if (res.ok) {
                fetchAlarms();
                setAlarmTitle('');
            }
        } catch (err) {
            console.error("Failed to add alarm", err);
        }
    };

    const deleteAlarm = async (id) => {
        try {
            const res = await fetch(`/api/alarms/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token },
            });
            if (res.ok) {
                fetchAlarms();
            }
        } catch (err) {
            console.error("Failed to delete alarm", err);
        }
    };
    
    const deactivateAlarm = async (id) => {
        try {
            const res = await fetch(`/api/alarms/${id}/deactivate`, {
                method: 'PUT',
                headers: { 'x-auth-token': token },
            });
            if (res.ok) {
                fetchAlarms();
            }
        } catch (err) {
            console.error("Failed to deactivate alarm", err);
        }
    };

    const togglePinAlarm = (alarm) => {
        const updatedAlarms = alarms.map(a => 
            a.alarm_id === alarm.alarm_id ? { ...a, pinned: !a.pinned } : a
        );
        setAlarms(updatedAlarms);
    };

    const formatAlarmTime = (dStr) => {
        const d = new Date(dStr.replace(' ', 'T'));
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const HH = String(d.getHours()).padStart(2, "0");
        const MM = String(d.getMinutes()).padStart(2, "0");
        return `${mm}월 ${dd}일 ${HH}시 ${MM}분`;
    };
    // --- 알람 로직 끝 ---

    const behaviorSlides = [
        {
            title: "자발적 놀이 참여 부족",
            cause: "발달지체, 자신감 부족, 동기 낮음",
            solution: "심리운동 놀이 제공, 선택권 부여, 작은 성공 경험 쌓기",
            example: "아이가 블록을 쌓도록 유도하고 “네가 먼저 어떤 블록을 쌓고 싶은지 골라볼래?”"
        },
        // ... (이하 생략)
    ];

    const nextSlide = () => setCurrentSlide((prev) => (prev === behaviorSlides.length - 1 ? 0 : prev + 1));
    const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? behaviorSlides.length - 1 : prev - 1));

    const calculateAge = (birthdate) => {
        const birthDate = new Date(birthdate);
        const today = new Date();
        let totalMonths = (today.getFullYear() - birthDate.getFullYear()) * 12;
        totalMonths -= birthDate.getMonth();
        totalMonths += today.getMonth();
        if (today.getDate() < birthDate.getDate()) {
            totalMonths--;
        }
        if (totalMonths < 0) totalMonths = 0;
        const ageInYears = Math.floor(totalMonths / 12);
        const ageInMonths = totalMonths % 12;
        return `${ageInYears}세 (${ageInMonths}개월)`;
    };

    const fetchBabies = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/babies', { headers: { 'x-auth-token': token } });
            const data = await res.json();
            if (res.ok) setBabies(data);
        } catch (err) {
            console.error('Failed to fetch babies:', err);
        }
    };

    const drawMiniChart = (canvas, records) => {
        if (!canvas || !records || records.length === 0) return;
        const ctx = canvas.getContext('2d');
        const data = records.map(r => ({ x: new Date(r.date).getTime(), y: r.weight })).sort((a,b) => a.x - b.x);

        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        ctx.scale(dpr, dpr);

        const pad = { l: 30, r: 10, t: 10, b: 20 };
        const W = cssW - pad.l - pad.r;
        const H = cssH - pad.t - pad.b;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, cssW, cssH);

        const xs = data.map((d) => d.x);
        const ys = data.map((d) => d.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const rangeX = maxX - minX || 1;
        const minY = Math.floor(Math.min(...ys) * 0.98);
        const maxY = Math.ceil(Math.max(...ys) * 1.02);
        const rangeY = maxY - minY || 1;

        const xToPx = (x) => pad.l + ((x - minX) / rangeX) * W;
        const yToPx = (y) => pad.t + (1 - (y - minY) / rangeY) * H;

        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 5; i++) {
            const y = pad.t + (i / 5) * H;
            ctx.moveTo(pad.l, y);
            ctx.lineTo(pad.l + W, y);
        }
        ctx.stroke();

        ctx.beginPath();
        data.forEach((p, idx) => {
            const x = xToPx(p.x);
            const y = yToPx(p.y);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = "#2563eb";
        ctx.stroke();

        ctx.fillStyle = "#2563eb";
        data.forEach((p) => {
            const x = xToPx(p.x);
            const y = yToPx(p.y);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = "#6b7280";
        ctx.font = "10px system-ui";
        for (let i = 0; i <= 5; i++) {
            const v = minY + (i / 5) * rangeY;
            const y = pad.t + (1 - i / 5) * H + 3;
            ctx.fillText(v.toFixed(1), 0, y);
        }

        [minX, maxX].forEach((x) => {
            const d = new Date(x);
            const s = `${d.getMonth() + 1}/${d.getDate()}`;
            const tx = xToPx(x) - 10;
            const ty = pad.t + H + 12;
            ctx.fillText(s, tx, ty);
        });
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/posts');
            const data = await res.json();
            if (res.ok) {
                setPosts(data.slice(0, 4)); // 최근 4개만 표시
            }
        } catch (err) {
            console.error("Failed to fetch posts", err);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchBabies();
        }
        fetchPosts();
        try {
            const raw = localStorage.getItem("growth_records_v1");
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) {
                    setGrowthRecords(arr);
                }
            }
        } catch (err) {
            console.error("Failed to load growth records", err);
        }
    }, [isAuthenticated, token]);

    useEffect(() => {
        drawMiniChart(growthChartRef.current, growthRecords);
    }, [growthRecords]);

    return (
        <main className="container">
            {isAuthenticated && babies.length === 0 && (
                 <section id="onboarding" className="card banner">
                    <div>👶 <strong>아기 프로필</strong>이 없습니다. 등록하면 개인화가 시작돼요.</div>
                    <div className="row" style={{marginLeft: 'auto'}}>
                        <button className="btn" id="addBaby" onClick={() => navigate('/mypage')}>아기 등록</button>
                    </div>
                </section>
            )}

            {babies.length > 0 ? (
                babies.map(baby => (
                    <section key={baby.baby_id} className="card" style={{marginBottom: '16px', display: 'flex', gap: '24px', alignItems: 'flex-start'}}>
                        <div style={{ flexShrink: 0, textAlign: 'center' }}>
                            {baby.profile_image_url ? (
                                <img src={baby.profile_image_url} alt={`${baby.name} 프로필`} width="400" height="400" style={{ objectFit: 'cover', borderRadius: '10px' }} />
                            ) : (
                                <div className="d-flex justify-content-center align-items-center" style={{ width: 400, height: 400, backgroundColor: '#e5e7eb', borderRadius: '10px' }}>
                                    <span className="text-white small" style={{color: '#6b7280'}}>사진없음</span>
                                </div>
                            )}
                            <h2 style={{margin: '12px 0 0', fontSize: '24px'}}>{baby.name}</h2>
                        </div>
                        <div style={{ flexGrow: 1, border: '1px solid #e5e7eb', borderRadius: '16px', padding: '20px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', fontSize: '16px', textAlign: 'center'}}>
                                <div><strong>나이:</strong><br/>{calculateAge(baby.birthdate)}</div>
                                <div><strong>성별:</strong><br/>{baby.gender}</div>
                                <div><strong>생년월일:</strong><br/>{new Date(baby.birthdate).toISOString().split('T')[0]}</div>
                                <div><strong>혈액형:</strong><br/>{baby.blood_type || '미입력'}</div>
                            </div>
                        </div>
                    </section>
                ))
            ) : (
                <section className="card" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px'}}>
                    <div>
                        <h2 style={{margin: '0 0 6px', fontSize: '28px', lineHeight: '1.2'}}>육아 초보를 위한 필수 홈</h2>
                        <div className="muted">오늘 필요한 것 90%를 한 화면에서</div>
                    </div>
                    <div className="pill muted" id="babyChip">아기: -</div>
                </section>
            )}

            <section className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <section className="card" id="behaviors">
                    <h3>행동 팁</h3>
                    <div className="behavior-slider">
                        <button className="slide-btn prev" onClick={prevSlide}>◀</button>
                        <div className="slide-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                            {behaviorSlides.map((slide, index) => (
                                <div className="behavior-card" key={index}>
                                    <h4>{slide.title}</h4>
                                    <p>🧠 의미/원인: {slide.cause}</p>
                                    <p>🛠️ 대응 방법: {slide.solution}</p>
                                    {slide.example && <p>🏠 일상 예시: {slide.example}</p>}
                                </div>
                            ))}
                        </div>
                        <button className="slide-btn next" onClick={nextSlide}>▶</button>
                    </div>
                </section>

                <div className="card" id="community">
                    <h3>커뮤니티 & 전문가 QnA</h3>
                    {posts.length > 0 ? (
                        <table className="record-table table-striped">
                            <tbody>
                                {posts.map(post => (
                                    <tr key={post.post_id}>
                                        <td>
                                            <Link to="/community" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                <span className="post-title">{post.title.replace('[전문가] ', '')}</span>
                                                <span className="post-nickname">{post.nickname}</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="muted">게시글이 없습니다.</div>
                    )}
                </div>
            </section>
            <section className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: '16px' }}>
                <div className="card" id="routines">
                    <h2>알람 설정</h2>
                    <div className="row" style={{ gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <input type="text" id="alarmTitle" placeholder="알람 제목" value={alarmTitle} onChange={(e) => setAlarmTitle(e.target.value)} style={{ flex: '1 1 150px' }} />
                        <input type="date" id="alarmDate" value={alarmDate} onChange={(e) => setAlarmDate(e.target.value)} style={{ flex: '1 1 120px' }} />
                        <input type="time" id="alarmTime" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} style={{ flex: '1 1 100px' }} />
                        <button onClick={addAlarm} className="btn primary" style={{ flex: '1 1 50px' }}>추가</button>
                    </div>
                    <h3>설정된 알람 목록</h3>
                    <ul id="alarmList">
                        {alarms.map(alarm => (
                            <li key={alarm.alarm_id}>
                                <span>{alarm.title} - {formatAlarmTime(alarm.alarm_time)}</span>
                                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                    <button className="btn pin" onClick={() => togglePinAlarm(alarm)}>
                                        {alarm.pinned ? '고정 해제' : '고정'}
                                    </button>
                                    <button className="btn delete" onClick={() => deleteAlarm(alarm.alarm_id)}>삭제</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card">
                    <h3>Continue Listening</h3>
                    <div className="row" style={{alignItems: 'center'}}>
                        <div style={{fontSize: '28px'}}>🧸</div>
                        <div style={{flex: 1}}>
                            <div className="title" id="nowTitle">{audioTitle || '재생할 항목 없음'}</div>
                            <div className="progress" aria-label="진행도">
                                <span id="progressBar" style={{width: '0%'}}></span>
                            </div>
                        </div>
                        {audioUrl && <button className="btn primary" id="playBtn" onClick={() => playerRef.current?.play()}>이어 듣기</button>}
                    </div>
                    <audio ref={playerRef} src={audioUrl} className="player" controls style={{ marginTop: '12px', display: audioUrl ? 'block' : 'none' }}></audio>
                </div>

                <div className="card" id="growth">
                    <h3>성장/건강 미리보기</h3>
                    <div className="muted" style={{marginBottom: '8px'}}>최근 기록</div>
                    <canvas ref={growthChartRef} style={{ width: '100%', height: '120px', borderRadius: '10px' }}></canvas>
                </div>
            </section>
        </main>
    );
};

export default HomePage;
