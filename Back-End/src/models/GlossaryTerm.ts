import mongoose, { Schema, Document } from "mongoose";

export interface IGlossaryTerm extends Document {
  term: string;
  explanation: string;
  createdAt: Date;
  updatedAt: Date;
}

const glossaryTermSchema = new Schema<IGlossaryTerm>(
  {
    term: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    explanation: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const GlossaryTerm = mongoose.model<IGlossaryTerm>("GlossaryTerm", glossaryTermSchema);
export default GlossaryTerm;
