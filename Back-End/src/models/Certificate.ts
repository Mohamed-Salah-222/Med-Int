import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICertificate extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  userName: string;
  userEmail: string;
  courseTitle: string;
  completionDate: Date;
  certificateNumber: string;
  verificationCode: string;
  finalExamScore: number;
  issuedAt: Date;
  certificateImageUrl?: string;
}

const certificateSchema = new Schema<ICertificate>(
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
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    courseTitle: {
      type: String,
      required: true,
    },
    completionDate: {
      type: Date,
      required: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
    },
    finalExamScore: {
      type: Number,
      required: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    certificateImageUrl: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

certificateSchema.index({ userId: 1, courseId: 1 });
certificateSchema.index({ certificateNumber: 1 });
certificateSchema.index({ verificationCode: 1 });

const Certificate = mongoose.model<ICertificate>("Certificate", certificateSchema);

export default Certificate;
