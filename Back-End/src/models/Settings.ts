import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  // Platform Settings
  platformName: string;
  supportEmail: string;
  timezone: string;
  maintenanceMode: boolean;

  // Course Settings
  defaultQuizPassingScore: number;
  defaultTestPassingScore: number;
  defaultExamPassingScore: number;
  defaultTestCooldownHours: number;
  defaultExamCooldownHours: number;
  unlimitedQuizRetries: boolean;

  // Email Settings
  smtpConfigured: boolean;
  emailNotificationsEnabled: boolean;

  // Certificate Settings
  certificatePrefix: string;
  autoIssueCertificates: boolean;
  certificateTemplate: string;

  // System Information (read-only, calculated)
  lastBackupDate?: Date;

  // Timestamps - ADD THESE
  createdAt: Date;
  updatedAt: Date;
}
const settingsSchema = new Schema<ISettings>(
  {
    // Platform Settings
    platformName: {
      type: String,
      default: "Medical Interpreter Platform",
    },
    supportEmail: {
      type: String,
      default: "support@medicalinterpreter.com",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    // Course Settings
    defaultQuizPassingScore: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    defaultTestPassingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    defaultExamPassingScore: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    defaultTestCooldownHours: {
      type: Number,
      default: 3,
      min: 0,
    },
    defaultExamCooldownHours: {
      type: Number,
      default: 24,
      min: 0,
    },
    unlimitedQuizRetries: {
      type: Boolean,
      default: true,
    },

    // Email Settings
    smtpConfigured: {
      type: Boolean,
      default: false,
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    // Certificate Settings
    certificatePrefix: {
      type: String,
      default: "MIC-2024-",
    },
    autoIssueCertificates: {
      type: Boolean,
      default: true,
    },
    certificateTemplate: {
      type: String,
      default: "default",
    },

    // System Information
    lastBackupDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model<ISettings>("Settings", settingsSchema);

export default Settings;
