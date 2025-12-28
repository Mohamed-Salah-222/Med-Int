import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILesson extends Document {
  chapterId: Types.ObjectId;
  title: string;
  lessonNumber: number;
  content: string;
  contentType: "text" | "audio-exercise";
  audioUrl?: string;
  quiz: {
    questions: Types.ObjectId[];
    passingScore: number;
    unlimitedAttempts: boolean;
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    lessonNumber: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      enum: ["text", "audio-exercise"],
      default: "text",
    },
    audioUrl: {
      type: String,
      required: false,
    },
    quiz: {
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
      unlimitedAttempts: {
        type: Boolean,
        default: true,
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Lesson = mongoose.model<ILesson>("Lesson", lessonSchema);

export default Lesson;
