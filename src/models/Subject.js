import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  icon: {
    type: String,
    default: '📚',
  },
  color: {
    type: String,
    default: 'sky', // sky, orange, emerald, purple, rose, amber, teal
  },
  gradeLevels: {
    type: [Number],
    default: [1, 2, 3, 4, 5],
  },
  order: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Subject', subjectSchema);

