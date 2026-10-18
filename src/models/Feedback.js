import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, maxlength: 80 },
  role:    { type: String, enum: ['student', 'parent', 'teacher', 'other'], default: 'other' },
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  rating:  { type: Number, min: 1, max: 5, default: 5 },
  status:  { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

export default mongoose.model('Feedback', feedbackSchema);

