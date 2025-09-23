const pool = require('./db');

exports.addBaby = async (req, res) => {
  const { name, birth_date, gender } = req.body;
  const userId = req.user.id; // authMiddleware에서 추가된 사용자 ID

  try {
    const [newBaby] = await pool.query(
      'INSERT INTO Babies (user_id, name, birth_date, gender) VALUES (?, ?, ?, ?)',
      [userId, name, birth_date, gender]
    );

    res.json({ id: newBaby.insertId, user_id: userId, name, birth_date, gender });
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