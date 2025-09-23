const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 헤더에서 토큰 가져오기
  const token = req.header('x-auth-token');

  // 토큰 존재 여부 확인
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 토큰 유효성 검사
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};