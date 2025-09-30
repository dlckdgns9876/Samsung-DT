const pool = require('./db');
const bcrypt = require('bcryptjs');
const { json } = require('body-parser');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const axios = require('axios');

exports.register = async (req, res) => {
  const { login_id, email, password, nickname } = req.body; // name은 더 이상 사용하지 않음

  try {
    // --- 유효성 검사 로직 추가 ---
    if (!login_id || login_id.length < 4 || login_id.length > 20) {
      return res.status(400).json({ msg: '아이디는 4자 이상 20자 이하로 입력해주세요.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ msg: '비밀번호는 6자 이상으로 입력해주세요.' });
    }

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ msg: '올바른 이메일 형식을 입력해주세요.' });
    }
    // --------------------------

    // 사용자 존재 여부 확인 (버그 수정: email -> login_id)
    let [users] = await pool.query('SELECT * FROM users WHERE login_id = ?', [login_id]);
    if (users.length > 0) {
      return res.status(400).json({ msg: '이미 존재하는 아이디입니다.' });
    }

    // 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 사용자 저장
    const [newUser] = await pool.query(
      'INSERT INTO Users (login_id, email, password, nickname) VALUES (?, ?, ?, ?)',
      [login_id, email, hashedPassword, nickname]
    );

    // JWT 생성
    const payload = { user: { id: newUser.insertId } }; // insertId는 user_id를 반환하므로 그대로 둡니다.
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { login_id, password } = req.body; // email -> login_id

  try {
    // 사용자 존재 여부 확인
    let [users] = await pool.query('SELECT * FROM users WHERE login_id = ?', [login_id]);
    console.log(users);
    
    if (users.length === 0) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const user = users[0];

    // 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // JWT 생성 (payload에 nickname 추가)
    const payload = { user: { id: user.user_id } }; // user.id -> user.user_id로 변경
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      // 로그인 성공 시 토큰과 함께 사용자 정보(nickname)를 반환
      res.json({
        token,
        user: { nickname: user.nickname }
      });
      console.log(token);
      
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.kakaoCallback = async (req, res) => {
  const { code } = req.query; // 카카오로부터 받은 인증 코드
  // 프론트엔드에서 사용하는 Redirect URI와 동일하게 맞춰야 함
  const redirectUri = 'http://localhost:5173/kakao/callback';

  try {
    // --- DEBUGGING: .env 로드 및 redirectUri 확인 ---
    console.log('--- Kakao Login Debug ---');
    console.log('CLIENT_ID:', process.env.VITE_KAKAO_REST_API_KEY);
    console.log('REDIRECT_URI:', redirectUri);
    console.log('-------------------------');
    // ---------------------------------------------

    // 1. 인증 코드로 액세스 토큰 받기 (axios 사용)
    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.VITE_KAKAO_REST_API_KEY, // VITE_ 접두사 사용
        redirect_uri: redirectUri, // 고정된 URI 사용
        code,
      },
      headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });
    const tokenData = tokenResponse.data;

    if (tokenData.error) {
      throw new Error(tokenData.error_description);
    }

    // 2. 액세스 토큰으로 사용자 정보 받기 (axios 사용)
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      }
    });
    const userData = userResponse.data;
    console.log(userData);    

    const kakaoId = userData.id;
    const nickname = userData.properties.nickname;
    const email = userData.kakao_account.email;

    // 3. 사용자 정보로 우리 DB 조회 및 처리
    let [users] = await pool.query('SELECT * FROM Users WHERE login_id = ?', [`kakao_${kakaoId}`]);

    let user = users[0];

    // 3-1. 새로운 사용자인 경우, 자동 회원가입
    if (!user) {
      const [newUser] = await pool.query(
        'INSERT INTO Users (login_id, email, nickname, password, provider) VALUES (?, ?, ?, ?, ?)',
        [`kakao_${kakaoId}`, email, nickname, 'social_login_password', 'kakao']
      );
      user = { user_id: newUser.insertId, nickname: nickname };
    }

    // 4. 우리 서비스의 JWT 토큰 발급
    const payload = { user: { id: user.user_id } };
    const ourToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 5. 토큰과 사용자 정보를 JSON으로 응답
    res.json({
      token: ourToken,
      user: { nickname: user.nickname }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error: 카카오 로그인 처리 중 오류가 발생했습니다.');
  }
};
