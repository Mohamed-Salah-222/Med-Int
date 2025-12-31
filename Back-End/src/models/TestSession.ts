import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITestSession extends Document {
  userId: Types.ObjectId;
  chapterId: Types.ObjectId;
  testType: "chapter" | "final";
  questions: Types.ObjectId[];
  answers: {
    questionId: Types.ObjectId;
    selectedAnswer: string | null;
    timeSpent: number;
  }[];
  startedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  isAbandoned: boolean;
  isSubmitted: boolean;
}

const testSessionSchema = new Schema<ITestSession>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    testType: {
      type: String,
      enum: ["chapter", "final"],
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedAnswer: {
          type: String,
          default: null,
        },
        timeSpent: {
          type: Number,
          default: 0,
        },
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isAbandoned: {
      type: Boolean,
      default: false,
    },
    isSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-expire sessions after 40 minutes (20 questions * 1 min + 20 min buffer)
testSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TestSession = mongoose.model<ITestSession>("TestSession", testSessionSchema);

export default TestSession;
