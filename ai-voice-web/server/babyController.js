const pool = require('./db');

exports.addBaby = async (req, res) => {
  // 새로운 컬럼들(blood_type, notes, profile_image_url)을 req.body에서 받음
  const { name, gender, birthdate, blood_type, notes } = req.body;
  const userId = req.user.id; // authMiddleware에서 추가된 사용자 ID

  // multer를 통해 파일이 업로드되면 req.file 객체에 정보가 담김
  // 파일 경로(URL)를 생성. 파일이 없으면 null.
  const profile_image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [newBaby] = await pool.query(
      'INSERT INTO Babies (user_id, name, gender, birthdate, blood_type, notes, profile_image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, gender, birthdate, blood_type, notes, profile_image_url]
    );
    console.log(newBaby);
    
    // 응답 데이터에도 새로운 필드 추가
    res.json({ id: newBaby.insertId, user_id: userId, name, gender, birthdate, blood_type, notes, profile_image_url: profile_image_url });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateBaby = async (req, res) => {
  const { name, gender, birthdate, blood_type, notes } = req.body;
  const babyId = req.params.id;
  const userId = req.user.id;

  try {
    // 아기 정보가 현재 로그인된 사용자의 소유인지 확인
    const [babies] = await pool.query('SELECT * FROM Babies WHERE baby_id = ? AND user_id = ?', [babyId, userId]);
    if (babies.length === 0) {
      return res.status(404).json({ msg: 'Baby not found or not authorized' });
    }

    // 정보 업데이트
    await pool.query(
      'UPDATE babies SET name = ?, gender = ?, birthdate = ?, blood_type = ?, notes = ? WHERE baby_id = ?',
      [name, gender, birthdate, blood_type, notes, babyId]
    );

    res.json({ msg: 'Baby information updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getMyBabies = async (req, res) => {
  const userId = req.user.id;

  try {
    const [babies] = await pool.query('SELECT * FROM Babies WHERE user_id = ?', [userId]);
    res.json(babies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
