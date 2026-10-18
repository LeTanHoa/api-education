import { Router } from 'express';
import Feedback from '../models/Feedback.js';
import { authenticate, allowRoles } from '../middlewares/auth.js';

const router = Router();

// PUBLIC — submit feedback (no auth required)
router.post('/', async (req, res, next) => {
  try {
    const { name, role, content, rating } = req.body;
    if (!name?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ tên và nội dung phản hồi.' });
    }
    const numericRating = rating == null ? 5 : Number(rating);
    if (role && !['student', 'parent', 'teacher', 'other'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
    }
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Đánh giá phải từ 1 đến 5 sao.' });
    }
    const fb = await Feedback.create({ name: name.trim(), role, content: content.trim(), rating: numericRating });
    res.status(201).json({ message: 'Cảm ơn bạn đã gửi phản hồi!', id: fb._id });
  } catch (err) { next(err); }
});

// PUBLIC — list approved feedbacks for landing page
router.get('/approved', async (req, res, next) => {
  try {
    const items = await Feedback.find({ status: 'approved' })
      .sort({ createdAt: -1 }).limit(20).select('name role content rating createdAt');
    res.json(items);
  } catch (err) { next(err); }
});

// ADMIN only below
router.use(authenticate, allowRoles('admin'));

// GET all feedbacks (admin)
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const filter = status && status !== 'all' ? { status } : {};
    const total = await Feedback.countDocuments(filter);
    const items = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);
    res.json({ items, total, page: pageNumber, pages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

// PATCH — approve / reject with optional admin note
router.patch('/:id', async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
    }
    const fb = await Feedback.findByIdAndUpdate(req.params.id, { status, adminNote }, { new: true });
    if (!fb) return res.status(404).json({ message: 'Không tìm thấy phản hồi.' });
    res.json(fb);
  } catch (err) { next(err); }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa phản hồi.' });
  } catch (err) { next(err); }
});

export default router;

