import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import cloudinary from "../config/cloudinary";
import QRCode from "qrcode";

// Register fonts with absolute path
const fontsPath = path.resolve(process.cwd(), "public", "fonts");
console.log("📁 Looking for fonts at:", fontsPath);

registerFont(path.join(fontsPath, "PlayfairDisplay-Bold.ttf"), {
  family: "Playfair Display",
  weight: "bold",
});

registerFont(path.join(fontsPath, "Montserrat-Regular.ttf"), {
  family: "Montserrat",
  weight: "normal",
});

registerFont(path.join(fontsPath, "Montserrat-SemiBold.ttf"), {
  family: "Montserrat",
  weight: "600",
});

console.log("✅ All fonts registered successfully");

interface CertificateData {
  userName: string;
  courseTitle: string;
  completionDate: Date;
  certificateNumber: string;
  verificationCode: string;
  finalExamScore: number;
  certificateType: "medical" | "hipaa";
}

export const generateCertificate = async (data: CertificateData): Promise<string> => {
  try {
    // Determine which template to use
    const templateFileName = data.certificateType === "medical" ? "medical-interpreter-certificate-bg.png" : "hipaa-certificate-bg.png";

    const templatePath = path.resolve(process.cwd(), "public", "certificates", "templates", templateFileName);
    console.log("📄 Loading template from:", templatePath);

    // Load template image
    const template = await loadImage(templatePath);

    // Create canvas with same dimensions as template
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext("2d");

    // Draw template as background
    ctx.drawImage(template, 0, 0, template.width, template.height);

    // ==========================================
    // USER NAME (in the blank space)
    // ==========================================
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 72px 'Playfair Display'";
    ctx.fillStyle = "#2C2C2C";

    // Position: centered in the blank name area
    const nameY = 645; // Adjust if needed
    ctx.fillText(data.userName, template.width / 2, nameY);

    // ==========================================
    // BOTTOM SECTION - Certificate Number, Date, Score/Verification
    // ==========================================
    ctx.font = "600 18px Montserrat";
    ctx.fillStyle = "#2C2C2C";

    // Certificate Number (left side, under "Certificate No")
    ctx.textAlign = "center";
    const certNumX = 1020; // X position under "Certificate No"
    const certNumY = 1150; // Y position
    ctx.fillText(data.certificateNumber, certNumX, certNumY);

    // Format completion date
    const formattedDate = data.completionDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Date (center, under "Date")
    const dateX = 1370; // X position under "Date"
    const dateY = 1150;
    ctx.fillText(formattedDate, dateX, dateY);

    // Score (for Medical) or Verification Code (for HIPAA) - right side
    if (data.certificateType === "medical") {
      // Score under "Score"
      const scoreX = 1724; // X position under "Score"
      const scoreY = 1150;
      ctx.fillText(`${data.finalExamScore}%`, scoreX, scoreY);
    }

    // ==========================================
    // QR CODE (between Certificate No and Badge)
    // ==========================================
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-certificate?certificateNumber=${data.certificateNumber}&verificationCode=${data.verificationCode}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: "#2C2C2C",
        light: "#FFFFFF",
      },
    });

    // Load QR code image
    const qrImage = await loadImage(qrCodeDataUrl);

    // Position QR code (between cert number and badge)
    const qrX = 480; // X position
    const qrY = 1030; // Y position
    const qrSize = 150;

    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Convert canvas to buffer
    const buffer = canvas.toBuffer("image/png");

    console.log("☁️ Uploading to Cloudinary...");

    // Upload to Cloudinary
    const uploadResult = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "certificates",
          public_id: `${data.certificateType}-${data.certificateNumber}`,
          resource_type: "image",
          format: "png",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error("Upload failed - no result"));
          }
        }
      );

      uploadStream.end(buffer);
    });

    console.log("✅ Certificate uploaded successfully:", uploadResult);
    return uploadResult;
  } catch (error) {
    console.error("❌ Error generating certificate:", error);
    throw new Error("Failed to generate certificate");
  }
};
