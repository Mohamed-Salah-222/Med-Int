import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  currentChapterNumber: number;
  currentLessonNumber: number;
  completedLessons: {
    lessonId: Types.ObjectId;
    completedAt: Date;
    quizScore: number;
    attempts: number;
    passed: boolean;
  }[];
  chapterTestAttempts: {
    chapterId: Types.ObjectId;
    attemptedAt: Date;
    score: number;
    passed: boolean;
  }[];
  chapterTestCooldowns: {
    chapterId: Types.ObjectId;
    lastAttemptAt: Date;
  }[];
  finalExamAttempts: {
    attemptedAt: Date;
    score: number;
    passed: boolean;
  }[];
  finalExamCooldown?: {
    lastAttemptAt: Date;
  };
  courseCompleted: boolean;
  completedAt?: Date;
  certificateIssued: boolean;
  certificateIssuedAt?: Date;
}

const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    currentChapterNumber: {
      type: Number,
      default: 1,
    },
    currentLessonNumber: {
      type: Number,
      default: 1,
    },
    completedLessons: [
      {
        lessonId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lesson",
        },
        completedAt: {
          type: Date,
        },
        quizScore: {
          type: Number,
        },
        attempts: {
          type: Number,
        },
        passed: {
          type: Boolean,
        },
      },
    ],
    chapterTestAttempts: [
      {
        chapterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chapter",
        },
        attemptedAt: {
          type: Date,
        },
        score: {
          type: Number,
        },
        passed: {
          type: Boolean,
        },
      },
    ],
    chapterTestCooldowns: [
      {
        chapterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chapter",
        },
        lastAttemptAt: {
          type: Date,
        },
      },
    ],
    finalExamAttempts: [
      {
        attemptedAt: {
          type: Date,
        },
        score: {
          type: Number,
        },
        passed: {
          type: Boolean,
        },
      },
    ],
    finalExamCooldown: {
      lastAttemptAt: {
        type: Date,
      },
    },
    courseCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateIssuedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const UserProgress = mongoose.model<IUserProgress>("UserProgress", userProgressSchema);

export default UserProgress;
