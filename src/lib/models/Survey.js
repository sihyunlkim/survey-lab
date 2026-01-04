import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'text', 'rating', 'likert', 'checkbox'],
    required: true,
  },
  options: [String],
  required: {
    type: Boolean,
    default: false,
  },
  order: Number,
});

const surveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questions: [questionSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  anonymousResponses: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  surveyCode: {
    type: String,
    unique: true,
    required: true,
  },
});

//auto generating survey code
surveySchema.pre('save', function () {
  if (!this.surveyCode) {
    this.surveyCode = Math.random().toString(36).substring(2, 15);
  }
  this.updatedAt = Date.now();
});

export default mongoose.models.Survey || mongoose.model('Survey', surveySchema);
