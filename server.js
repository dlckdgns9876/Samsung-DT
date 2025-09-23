const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// .env 파일 로드
dotenv.config();

const app = express();

// JSON 및 URL-encoded 데이터 파싱을 위한 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, 'public')));

// 라우트 설정
app.use('/api/auth', require('./auth'));
app.use('/api/babies', require('./babies'));
app.use('/api/users', require('./users'));
app.use('/api/auth/kakao/callback', require('./users'));
app.use('/', require('./pages'));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});