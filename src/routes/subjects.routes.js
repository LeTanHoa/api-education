import { Router } from 'express';
import Subject from '../models/Subject.js';
import Lesson from '../models/Lesson.js';
import Question from '../models/Question.js';
import { authenticate, allowRoles } from '../middlewares/auth.js';

const router = Router();

export const DEFAULT_SUBJECTS = [
  {
    key: 'math',
    name: 'Toán học',
    description: 'Rèn luyện tư duy logic, phép tính và giải quyết vấn đề qua các bài toán sinh động.',
    icon: '📐',
    color: 'sky',
    gradeLevels: [1, 2, 3, 4, 5],
    order: 1,
    status: 'active',
  },
  {
    key: 'vietnamese',
    name: 'Tiếng Việt',
    description: 'Làm giàu vốn từ vựng, rèn luyện kỹ năng đọc hiểu, chính tả và cảm thụ ngôn từ.',
    icon: '📖',
    color: 'orange',
    gradeLevels: [1, 2, 3, 4, 5],
    order: 2,
    status: 'active',
  },
  {
    key: 'english',
    name: 'Tiếng Anh',
    description: 'Làm quen từ vựng cơ bản, phát âm chuẩn và các mẫu câu giao tiếp tự nhiên hằng ngày.',
    icon: '🌍',
    color: 'emerald',
    gradeLevels: [1, 2, 3, 4, 5],
    order: 3,
    status: 'active',
  },
  {
    key: 'science',
    name: 'Khoa học & Tự nhiên',
    description: 'Khám phá thế giới động thực vật kỳ thú và những hiện tượng khoa học diệu kỳ quanh ta.',
    icon: '🔬',
    color: 'purple',
    gradeLevels: [1, 2, 3, 4, 5],
    order: 4,
    status: 'active',
  },
  {
    key: 'informatics',
    name: 'Tin học & Công nghệ',
    description: 'Làm quen với máy tính, tư duy thuật toán trực quan và kỹ năng số thông minh, an toàn.',
    icon: '💻',
    color: 'teal',
    gradeLevels: [3, 4, 5],
    order: 5,
    status: 'active',
  },
];

// Helper to ensure initial subjects exist
export async function ensureDefaultSubjects() {
  for (const s of DEFAULT_SUBJECTS) {
    const exists = await Subject.findOne({ key: s.key });
    if (!exists) {
      await Subject.create(s);
    }
  }
}

// GET /api/subjects (Public / All users)
router.get('/', async (req, res, next) => {
  try {
    await ensureDefaultSubjects();

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    } else if (req.query.all !== 'true') {
      filter.status = 'active';
    }

    if (req.query.grade) {
      const grade = Number(req.query.grade);
      if (Number.isInteger(grade)) {
        filter.gradeLevels = grade;
      }
    }

    const subjects = await Subject.find(filter).sort({ createdAt: -1 }).lean();

    // Aggregate lesson count per subject
    const lessonCounts = await Lesson.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(lessonCounts.map(item => [item._id, item.count]));

    const withMeta = subjects.map(s => ({
      ...s,
      lessonsCount: countMap.get(s.key) || 0,
    }));

    res.json(withMeta);
  } catch (err) {
    next(err);
  }
});

// POST /api/subjects (Admin only)
router.post('/', authenticate, allowRoles('admin'), async (req, res, next) => {
  try {
    const { name, key, description, icon, color, gradeLevels, order, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên môn học không được để trống.' });
    }

    const cleanKey = (key || name)
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    if (!cleanKey) {
      return res.status(400).json({ message: 'Mã môn học không hợp lệ.' });
    }

    const existing = await Subject.findOne({ key: cleanKey });
    if (existing) {
      return res.status(400).json({ message: `Mã môn học "${cleanKey}" đã tồn tại.` });
    }

    const created = await Subject.create({
      key: cleanKey,
      name: name.trim(),
      description: description?.trim() || '',
      icon: icon?.trim() || '📚',
      color: color || 'sky',
      gradeLevels: Array.isArray(gradeLevels) && gradeLevels.length ? gradeLevels : [1, 2, 3, 4, 5],
      order: typeof order === 'number' ? order : 0,
      status: status || 'active',
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH or PUT /api/subjects/:id (Admin only)
router.patch('/:id', authenticate, allowRoles('admin'), async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Không tìm thấy môn học.' });
    }

    const { name, key, description, icon, color, gradeLevels, order, status } = req.body;

    if (key && key.trim().toLowerCase() !== subject.key) {
      const cleanKey = key
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9_-]/g, '_');

      const existing = await Subject.findOne({ key: cleanKey, _id: { $ne: subject._id } });
      if (existing) {
        return res.status(400).json({ message: `Mã môn học "${cleanKey}" đã tồn tại.` });
      }

      const oldKey = subject.key;
      subject.key = cleanKey;

      // Update references in lessons and questions
      await Lesson.updateMany({ subject: oldKey }, { $set: { subject: cleanKey } });
      await Question.updateMany({ subject: oldKey }, { $set: { subject: cleanKey } });
    }

    if (name) subject.name = name.trim();
    if (description !== undefined) subject.description = description.trim();
    if (icon) subject.icon = icon.trim();
    if (color) subject.color = color;
    if (Array.isArray(gradeLevels)) subject.gradeLevels = gradeLevels;
    if (typeof order === 'number') subject.order = order;
    if (status) subject.status = status;

    await subject.save();
    res.json(subject);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subjects/:id (Admin only)
router.delete('/:id', authenticate, allowRoles('admin'), async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Không tìm thấy môn học.' });
    }

    const lessonsCount = await Lesson.countDocuments({ subject: subject.key });
    if (lessonsCount > 0) {
      return res.status(400).json({
        message: `Không thể xóa môn học "${subject.name}" vì có ${lessonsCount} khóa học đang gắn với môn này. Hãy chuyển các khóa học sang môn khác trước hoặc đổi trạng thái môn học sang "Tạm dừng".`,
      });
    }

    await subject.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;

