const express = require('express');
const router = express.Router();
const { getAlarms, createAlarm, updateAlarm, deleteAlarm, rescheduleAlarm, deactivateAlarm, pinAndRescheduleAlarm } = require('./alarmController');
const authMiddleware = require('./authMiddleware'); // 인증이 필요하다면 사용

// 모든 알람 조회
router.get('/', authMiddleware, getAlarms);

// 알람 생성
router.post('/', authMiddleware, createAlarm);

// 알람 수정 (일반)
router.put('/:id', authMiddleware, updateAlarm);

// 알람 삭제
router.delete('/:id', authMiddleware, deleteAlarm);

// 알람 재예약 (고정된 알람용)
router.put('/:id/reschedule', authMiddleware, rescheduleAlarm);

// 알람 비활성화
router.put('/:id/deactivate', authMiddleware, deactivateAlarm);

// 알람 고정 및 재예약
router.put('/:id/pin', authMiddleware, pinAndRescheduleAlarm);

module.exports = router;
