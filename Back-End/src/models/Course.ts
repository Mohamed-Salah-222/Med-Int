import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface ICourse extends Document {
  title: string;
  description: string;
  totalChapters: number;
  chapters: ObjectId[];
  finalExam: {
    questions: ObjectId[];
    passingScore: number;
    cooldownHours: number;
    timeLimit: number;
  };
  isPublished: boolean;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    totalChapters: {
      type: Number,
      required: true,
    },
    chapters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chapter",
      },
    ],
    finalExam: {
      questions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
      ],
      passingScore: {
        type: Number,
        default: 80,
      },
      cooldownHours: {
        type: Number,
        default: 24,
      },
      timeLimit: {
        type: Number,
        default: 100,
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model<ICourse>("Course", courseSchema);

export default Course;
