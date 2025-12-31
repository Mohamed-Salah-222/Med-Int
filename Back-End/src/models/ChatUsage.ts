import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChatUsage extends Document {
  userId: Types.ObjectId;
  lessonId: Types.ObjectId;
  messageCount: number;
  lastMessageAt: Date;
}

const chatUsageSchema = new Schema<IChatUsage>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for userId + lessonId
chatUsageSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

const ChatUsage = mongoose.model<IChatUsage>("ChatUsage", chatUsageSchema);

export default ChatUsage;
