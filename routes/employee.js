const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// All employee routes require authentication and employee role
router.use(auth);
router.use(requireRole(['employee']));

// @route   POST /api/employee/checkin
// @desc    Mark attendance (check-in)
// @access  Private/Employee
router.post('/checkin', [
  body('latitude').optional().isNumeric(),
  body('longitude').optional().isNumeric(),
  body('photo').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { latitude, longitude, photo } = req.body;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const { Attendance, User } = req.app.get('models');
    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      where: {
        employeeId: req.user.id,
        date: today
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      employeeId: req.user.id,
      date: today,
      checkIn: new Date(),
      latitude: latitude || null,
      longitude: longitude || null,
      photo: photo || null
    });

    const populatedAttendance = await Attendance.findByPk(attendance.id, {
      include: [{
        model: User,
        as: 'employee',
        attributes: ['name', 'email']
      }]
    });

    res.json({
      message: 'Checked in successfully',
      attendance: populatedAttendance
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/employee/checkout
// @desc    Check-out for the day
// @access  Private/Employee
router.put('/checkout', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const { Attendance, User } = req.app.get('models');
    const attendance = await Attendance.findOne({
      where: {
        employeeId: req.user.id,
        date: today
      }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No check-in found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    const populatedAttendance = await Attendance.findByPk(attendance.id, {
      include: [{
        model: User,
        as: 'employee',
        attributes: ['name', 'email']
      }]
    });

    res.json({
      message: 'Checked out successfully',
      attendance: populatedAttendance
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employee/attendance
// @desc    Get employee's attendance history
// @access  Private/Employee
router.get('/attendance', async (req, res) => {
  try {
    const { Attendance } = req.app.get('models');
    const attendance = await Attendance.findAll({
      where: { employeeId: req.user.id },
      order: [['date', 'DESC']]
    });

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employee/today
// @desc    Get today's attendance status
// @access  Private/Employee
router.get('/today', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const { Attendance } = req.app.get('models');
    const attendance = await Attendance.findOne({
      where: {
        employeeId: req.user.id,
        date: today
      }
    });

    if (!attendance) {
      return res.json({ status: 'not_checked_in' });
    }

    res.json({
      status: attendance.checkOut ? 'checked_out' : 'checked_in',
      attendance
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/employee/leave
// @desc    Apply for leave
// @access  Private/Employee
router.post('/leave', [
  body('leaveType').isIn(['sick', 'casual', 'annual', 'maternity', 'paternity', 'other']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('reason').isLength({ min: 10, max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { leaveType, startDate, endDate, reason } = req.body;

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return res.status(400).json({ message: 'Start date cannot be in the past' });
  }

  if (end < start) {
    return res.status(400).json({ message: 'End date must be after start date' });
  }

  try {
    const { Leave, User } = req.app.get('models');
    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      where: {
        employeeId: req.user.id,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          {
            startDate: { [Op.lte]: end },
            endDate: { [Op.gte]: start }
          }
        ]
      }
    });

    if (overlappingLeave) {
      return res.status(400).json({ message: 'You already have a leave request for these dates' });
    }

    const leave = await Leave.create({
      employeeId: req.user.id,
      leaveType,
      startDate: start,
      endDate: end,
      reason
    });

    const populatedLeave = await Leave.findByPk(leave.id, {
      include: [{
        model: User,
        as: 'employee',
        attributes: ['name', 'email']
      }]
    });

    res.json({
      message: 'Leave application submitted successfully',
      leave: populatedLeave
    });
  } catch (error) {
    console.error('Leave application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employee/leave
// @desc    Get employee's leave history
// @access  Private/Employee
router.get('/leave', async (req, res) => {
  try {
    const { Leave, User } = req.app.get('models');
    const leaves = await Leave.findAll({
      where: { employeeId: req.user.id },
      include: [{
        model: User,
        as: 'approver',
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(leaves);
  } catch (error) {
    console.error('Get leave history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
