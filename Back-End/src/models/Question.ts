import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  questionText: string;
  options: string[];
  correctAnswer: number;
  type: "quiz" | "test" | "exam";
  explanation?: string;
  audioUrl?: string;
  difficulty?: "easy" | "medium" | "hard";
}

const questionSchema = new Schema<IQuestion>(
  {
    questionText: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr: string[]) {
          return arr.length === 4;
        },
        message: "A question must have exactly 4 options",
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    type: {
      type: String,
      enum: ["quiz", "test", "exam"],
      required: true,
    },
    explanation: {
      type: String,
      required: false,
    },
    audioUrl: {
      type: String,
      required: false,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: false,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model<IQuestion>("Question", questionSchema);

export default Question;
