const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireRole(['admin']));

// @route   GET /api/admin/employees
// @desc    Get all employees
// @access  Private/Admin
router.get('/employees', async (req, res) => {
  try {
    const { User } = req.app.get('models');
    const employees = await User.findAll({
      where: { role: 'employee' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/employees
// @desc    Add new employee
// @access  Private/Admin
router.post('/employees', [
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    const { User } = req.app.get('models');
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'employee'
    });

    // Return user without password
    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/employees/:id
// @desc    Get employee by ID
// @access  Private/Admin
router.get('/employees/:id', async (req, res) => {
  try {
    const { User } = req.app.get('models');
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user || user.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/employees/:id
// @desc    Update employee
// @access  Private/Admin
router.put('/employees/:id', [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, isActive } = req.body;

  try {
    const { User } = req.app.get('models');
    let user = await User.findByPk(req.params.id);
    if (!user || user.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/employees/:id
// @desc    Delete employee
// @access  Private/Admin
router.delete('/employees/:id', async (req, res) => {
  try {
    const { User } = req.app.get('models');
    const user = await User.findByPk(req.params.id);
    if (!user || user.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({ message: 'Employee deactivated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/attendance
// @desc    Get all attendance records
// @access  Private/Admin
router.get('/attendance', async (req, res) => {
  try {
    const { Attendance, User } = req.app.get('models');
    const attendance = await Attendance.findAll({
      include: [{
        model: User,
        as: 'employee',
        attributes: ['name', 'email']
      }],
      order: [['date', 'DESC'], ['checkIn', 'DESC']]
    });

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/leaves
// @desc    Get all leave requests
// @access  Private/Admin
router.get('/leaves', async (req, res) => {
  try {
    const { Leave, User } = req.app.get('models');
    const leaves = await Leave.findAll({
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(leaves);
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/leaves/:id
// @desc    Approve or reject leave request
// @access  Private/Admin
router.put('/leaves/:id', [
  body('status').isIn(['approved', 'rejected']),
  body('comments').optional().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { status, comments } = req.body;

  try {
    const { Leave, User } = req.app.get('models');
    const leave = await Leave.findByPk(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request has already been processed' });
    }

    leave.status = status;
    leave.approvedById = req.user.id;
    leave.approvedAt = new Date();
    if (comments) {
      leave.comments = comments;
    }

    await leave.save();

    const updatedLeave = await Leave.findByPk(leave.id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['name']
        }
      ]
    });

    res.json({
      message: `Leave request ${status}`,
      leave: updatedLeave
    });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
