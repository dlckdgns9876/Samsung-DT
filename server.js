const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// .env 파일 로드 (절대 경로로 지정)
dotenv.config({ path: path.resolve(__dirname, 'ai-voice-web', '.env') });

const app = express();

// JSON 및 URL-encoded 데이터 파싱을 위한 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, 'public')));
// 업로드된 파일 제공 (public/uploads 폴더)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우트 설정 (ai-voice-web/server/ 내부 파일을 사용하도록 경로 수정)
app.use('/api/auth', require('./ai-voice-web/server/auth'));
app.use('/api/babies', require('./ai-voice-web/server/babies'));
app.use('/api/users', require('./ai-voice-web/server/users'));
app.use('/api/posts', require('./ai-voice-web/server/posts'));
app.use('/api/comments', require('./ai-voice-web/server/comments'));
app.use('/api/alarms', require('./ai-voice-web/server/alarms'));
app.use('/', require('./ai-voice-web/server/pages'));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
