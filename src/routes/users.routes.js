import { Router } from 'express';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Lesson from '../models/Lesson.js';
import Question from '../models/Question.js';
import { authenticate, allowRoles } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate);

router.get('/me', async (req, res) =>
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    grade: req.user.grade,
    baseXP: req.user.baseXP || 0,
    baseCoins: req.user.baseCoins || 0,
  })
);

router.patch('/me', allowRoles('student'), async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Họ tên không được để trống' });
    req.user.name = name;
    await req.user.save();
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      grade: req.user.grade,
    });
  } catch (e) {
    next(e);
  }
});

router.put('/me/password', allowRoles('student'), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || String(newPassword).length < 6)
      return res.status(400).json({ message: 'Nhập mật khẩu hiện tại và mật khẩu mới có ít nhất 6 ký tự' });
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.verifyPassword(currentPassword)))
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Đã đổi mật khẩu thành công' });
  } catch (e) {
    next(e);
  }
});

router.get('/students', allowRoles('teacher', 'admin'), async (req, res, next) => {
  try {
    res.json(await User.find({ role: 'student', active: true }).select('-password').sort({ createdAt: -1, name: 1 }));
  } catch (e) {
    next(e);
  }
});

router.get('/', allowRoles('admin'), async (req, res, next) => {
  try {
    const { role, active, grade, search } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
    const f = { role: role || { $ne: 'parent' } };
    if (role === 'parent') return res.json([]);
    if (active !== undefined && active !== '') f.active = active === 'true';
    if (grade) f.grade = grade;
    if (search)
      f.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    res.json(await User.find(f).select('-password').sort({ createdAt: -1 }).limit(limit));
  } catch (e) {
    next(e);
  }
});

router.post('/', allowRoles('admin'), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.role !== 'student') {
      delete data.grade;
      data.grade = undefined;
    } else if (!['1', '2', '3', '4', '5'].includes(String(data.grade))) {
      data.grade = '1';
    }
    const user = await User.create(data);
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      grade: user.grade,
      active: user.active,
      createdAt: user.createdAt,
    });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', allowRoles('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const previousGrade = user.grade;
    if (req.user.id === user.id && (req.body.active === false || (req.body.role && req.body.role !== 'admin')))
      return res.status(400).json({ message: 'Không thể khóa hoặc hạ quyền tài khoản quản trị đang đăng nhập' });
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Họ tên không được để trống' });
      user.name = name;
    }
    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Email không hợp lệ' });
      user.email = email;
    }
    if (req.body.role !== undefined) {
      if (!['student', 'teacher', 'admin'].includes(req.body.role))
        return res.status(400).json({ message: 'Vai trò không hợp lệ' });
      user.role = req.body.role;
      if (user.role !== 'student') {
        user.grade = undefined;
      }
    }
    if (req.body.grade !== undefined) {
      if (user.role === 'student') {
        if (!['1', '2', '3', '4', '5'].includes(String(req.body.grade)))
          return res.status(400).json({ message: 'Khối lớp phải từ 1 đến 5' });
        user.grade = String(req.body.grade);
      } else {
        user.grade = undefined;
      }
    }
    if (req.body.active !== undefined) {
      if (typeof req.body.active !== 'boolean') return res.status(400).json({ message: 'Trạng thái tài khoản không hợp lệ' });
      user.active = req.body.active;
    }
    await user.save();
    const learningDataReset = user.role === 'student' && previousGrade !== user.grade;
    if (learningDataReset) {
      const existingProgress = await Progress.find({ student: user._id });
      const completedRecords = existingProgress.filter(p => p.completedAt || p.latestAttempt);
      const totalCorrect = existingProgress.reduce((sum, p) => {
        const attempt = p.latestAttempt;
        if (attempt) return sum + (attempt.correctCount || 0);
        return sum + (p.answers || []).filter(a => a.correct).length;
      }, 0);

      const xpFromProgress = (totalCorrect * 10) + (completedRecords.length * 50);
      const coinsFromProgress = (completedRecords.length * 10);

      user.baseXP = (user.baseXP || 0) + xpFromProgress;
      user.baseCoins = (user.baseCoins || 0) + coinsFromProgress;
      await user.save();

      // Reset lesson progress records for the new grade
      await Progress.deleteMany({ student: user._id });
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      grade: user.grade,
      active: user.active,
      createdAt: user.createdAt,
      baseXP: user.baseXP || 0,
      baseCoins: user.baseCoins || 0,
      learningDataReset,
    });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', allowRoles('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (req.user.id === user.id || req.user._id?.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản quản trị đang đăng nhập' });
    }

    if (user.role === 'student') {
      await Progress.deleteMany({ student: user._id });
      await Attendance.deleteMany({ student: user._id });
      await Assignment.updateMany({ students: user._id }, { $pull: { students: user._id } });
    } else if (user.role === 'teacher') {
      await Assignment.deleteMany({ teacher: user._id });
      await Lesson.updateMany({ createdBy: user._id }, { createdBy: req.user.id });
      await Question.updateMany({ createdBy: user._id }, { createdBy: req.user.id });
    }

    await user.deleteOne();
    res.json({ message: 'Đã xóa người dùng thành công' });
  } catch (e) {
    next(e);
  }
});

export default router;
