import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  answer: mongoose.Schema.Types.Mixed,
});

const responseSchema = new mongoose.Schema({
  survey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,  
  },
  answers: [answerSchema],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  sessionId: String,
  completionTime: Number,
  isAnonymous: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.models.Response || mongoose.model('Response', responseSchema);