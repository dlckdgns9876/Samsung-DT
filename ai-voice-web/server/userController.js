const pool = require('./db');
const bcrypt = require('bcryptjs');

// 닉네임 변경
exports.updateNickname = async (req, res) => {
  const { nickname } = req.body;
  const userId = req.user.id; // JWT 토큰에서 가져온 사용자의 고유 ID (숫자)

  if (!nickname || nickname.length < 2) {
    return res.status(400).json({ msg: '닉네임은 2자 이상으로 입력해주세요.' });
  }

  try {
    await pool.query('UPDATE Users SET nickname = ? WHERE user_id = ?', [nickname, userId]);
    res.json({ nickname });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 비밀번호 변경
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // JWT 토큰에서 가져온 사용자의 고유 ID (숫자)

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ msg: '새 비밀번호는 6자 이상으로 입력해주세요.' });
  }

  try {
    const [users] = await pool.query('SELECT password FROM Users WHERE user_id = ?', [userId]);
    const user = users[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: '현재 비밀번호가 일치하지 않습니다.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);    

    await pool.query('UPDATE Users SET password = ? WHERE user_id = ?', [hashedPassword, userId]);
    console.log(hashedPassword, userId);
    

    res.json({ msg: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};