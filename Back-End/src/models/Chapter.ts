import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChapter extends Document {
  courseId: Types.ObjectId;
  title: string;
  description: string;
  chapterNumber: number;
  lessons: Types.ObjectId[];
  chapterTest: {
    questions: Types.ObjectId[];
    passingScore: number;
    cooldownHours: number;
    timeLimit: number;
  };
  isPublished: boolean;
  createdAt: Date; 
  updatedAt: Date; 
}

const chapterSchema = new Schema<IChapter>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    chapterNumber: {
      type: Number,
      required: true,
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    chapterTest: {
      questions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
      ],
      passingScore: {
        type: Number,
        default: 70,
      },
      cooldownHours: {
        type: Number,
        default: 3,
      },
      timeLimit: {
        type: Number,
        default: 20,
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Chapter = mongoose.model<IChapter>("Chapter", chapterSchema);

export default Chapter;
