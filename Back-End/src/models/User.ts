import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "User" | "Student" | "Admin" | "SuperVisor";
  isVerified: boolean;
  //* Bumped whenever every existing session for this user must stop working:
  //* a password change, or a role change. Tokens carry the value they were
  //* signed with, so a mismatch means the token predates that event.
  tokenVersion: number;
  //* Informational audit trail; tokenVersion is what actually enforces.
  passwordChangedAt?: Date;
  //* SHA-256 hash (64-char hex) of the emailed code — never the code itself.
  verificationCode?: string;
  verificationCodeExpires?: Date;
  //* SHA-256 hash (64-char hex) of the emailed reset token — never the token itself.
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(UserPassword: string): Promise<boolean>;

  googleId?: string;
  linkedinId?: string;
}
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["User", "Student", "Admin", "SuperVisor"],
      default: "User",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      required: true,
    },
    passwordChangedAt: {
      type: Date,
    },
    //* Stores the SHA-256 hash of the emailed verification code, not the code.
    //* Written via hashToken() in utils/generateCode.
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
    //* Stores the SHA-256 hash of the emailed reset token, not the token.
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values
    },
    linkedinId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

//* Password hashing
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

//* Session invalidation.
//* This lives on the model rather than in each controller so that *any* code
//* path changing a password or role revokes existing tokens — including ones
//* written later. Every User mutation in this codebase goes through .save(),
//* so document middleware sees them all; a findOneAndUpdate that touched
//* password or role would bypass this and would need its own bump.
//* `isNew` is excluded so freshly registered users start at version 0 rather
//* than being handed a token that is already one version behind.
userSchema.pre("save", function () {
  if (this.isNew) return;

  if (this.isModified("password")) {
    this.tokenVersion += 1;
    this.passwordChangedAt = new Date();
  } else if (this.isModified("role")) {
    //* `else if` so a single save that changes both only bumps once — the
    //* count is a revocation marker, not a tally of events.
    this.tokenVersion += 1;
  }
});

//* Comparing
userSchema.methods.comparePassword = async function (userPassword: string): Promise<boolean> {
  return await bcrypt.compare(userPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
