const pool = require('./db');

exports.getAlarms = async (req, res) => {
    try {
        const [alarms] = await pool.query('SELECT * FROM alarms WHERE user_id = ? AND is_active = 1', [req.user.id]);
        res.json(alarms);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createAlarm = async (req, res) => {
    const { title, date, time } = req.body;
    const alarm_time = `${date} ${time}:00`;
    try {
        const [result] = await pool.query(
            'INSERT INTO alarms (user_id, title, alarm_time) VALUES (?, ?, ?)',
            [req.user.id, title, alarm_time]
        );
        res.json({ alarm_id: result.insertId, title, alarm_time });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateAlarm = async (req, res) => {
    // 이 함수는 현재 사용되지 않지만, 추후 확장을 위해 남겨둡니다.
    res.status(501).json({ msg: 'Not Implemented' });
};

exports.deleteAlarm = async (req, res) => {
    try {
        await pool.query('DELETE FROM alarms WHERE alarm_id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ msg: 'Alarm removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.rescheduleAlarm = async (req, res) => {
    const { new_alarm_time } = req.body;
    try {
        await pool.query('UPDATE alarms SET alarm_time = ? WHERE alarm_id = ? AND user_id = ?', [new_alarm_time, req.params.id, req.user.id]);
        res.json({ msg: 'Alarm rescheduled' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deactivateAlarm = async (req, res) => {
    try {
        await pool.query('UPDATE alarms SET is_active = 0 WHERE alarm_id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ msg: 'Alarm deactivated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.pinAndRescheduleAlarm = async (req, res) => {
    const alarmId = req.params.id;
    const userId = req.user.id;

    try {
        const [alarms] = await pool.query('SELECT * FROM alarms WHERE alarm_id = ? AND user_id = ?', [alarmId, userId]);
        if (alarms.length === 0) {
            return res.status(404).json({ msg: 'Alarm not found or not authorized' });
        }

        const currentAlarmTime = new Date(alarms[0].alarm_time);
        currentAlarmTime.setDate(currentAlarmTime.getDate() + 1);
        
        const year = currentAlarmTime.getFullYear();
        const month = String(currentAlarmTime.getMonth() + 1).padStart(2, '0');
        const day = String(currentAlarmTime.getDate()).padStart(2, '0');
        const hours = String(currentAlarmTime.getHours()).padStart(2, '0');
        const minutes = String(currentAlarmTime.getMinutes()).padStart(2, '0');
        const seconds = String(currentAlarmTime.getSeconds()).padStart(2, '0');
        const newAlarmTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        await pool.query('UPDATE alarms SET alarm_time = ? WHERE alarm_id = ?', [newAlarmTime, alarmId]);
        res.json({ msg: 'Alarm pinned and rescheduled for the next day' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
