import { createCanvas, loadImage, registerFont } from "canvas";
import type { CanvasRenderingContext2D } from "canvas";
import path from "path";
import cloudinary from "../config/cloudinary";
import QRCode from "qrcode";

const NAVY = "#1B3A5C";
const TEXT = "#2C2C2C";

// Register fonts with absolute path.
const fontsPath = path.resolve(process.cwd(), "public", "fonts");
console.log("Looking for fonts at:", fontsPath);

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

console.log("All fonts registered successfully");

interface CertificateData {
  userName: string;
  courseTitle: string;
  completionDate: Date;
  certificateNumber: string;
  verificationCode: string;
  finalExamScore: number;
  certificateType: "course" | "medical" | "hipaa";
  courseDescription?: string;
}

const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const setFont = (ctx: CanvasRenderingContext2D, weight: string, size: number, family: string) => {
  ctx.font = `${weight} ${Math.round(size)}px "${family}"`;
};

const fitText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startingSize: number, minSize: number, weight: string, family: string) => {
  let size = startingSize;
  setFont(ctx, weight, size, family);

  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    setFont(ctx, weight, size, family);
  }
};

const drawCentered = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, options: { size: number; weight?: string; family?: string; color?: string; maxWidth?: number; baseline?: CanvasTextBaseline }) => {
  const weight = options.weight || "normal";
  const family = options.family || "Montserrat";

  ctx.textAlign = "center";
  ctx.textBaseline = options.baseline || "middle";
  ctx.fillStyle = options.color || TEXT;

  if (options.maxWidth) {
    fitText(ctx, text, options.maxWidth, options.size, Math.max(14, options.size * 0.55), weight, family);
  } else {
    setFont(ctx, weight, options.size, family);
  }

  ctx.fillText(text, x, y);
};

const getTemplateFileName = (certificateType: CertificateData["certificateType"]) => {
  return certificateType === "hipaa" ? "hipaa-certificate-bg.png" : "course-certificate-bg.png";
};

const drawCourseCertificate = (ctx: CanvasRenderingContext2D, data: CertificateData, width: number, height: number) => {
  const centerX = width / 2;
  const contentMaxWidth = width * 0.72;
  const titleY = height * 0.315;
  const subtitleY = height * 0.345;
  const bottomBaselineY = height * 0.847;

  drawCentered(ctx, "CERTIFICATE OF COMPLETION", centerX, titleY, {
    size: Math.min(height * 0.027, 26),
    weight: "bold",
    family: "Playfair Display",
    color: NAVY,
    maxWidth: contentMaxWidth,
  });

  drawCentered(ctx, "Medical Interpreter Course", centerX, subtitleY, {
    size: Math.min(height * 0.017, 16),
    weight: "600",
    color: NAVY,
    maxWidth: contentMaxWidth,
  });

  drawCentered(ctx, "This is to certify that", centerX, height * 0.43, {
    size: height * 0.025,
    color: TEXT,
    maxWidth: contentMaxWidth,
  });

  drawCentered(ctx, data.userName, centerX, height * 0.525, {
    size: height * 0.065,
    weight: "bold",
    family: "Playfair Display",
    color: TEXT,
    maxWidth: width * 0.74,
  });

  drawCentered(ctx, data.courseDescription || "has successfully completed 40 Hours Professional Medical Interpreter Training Program", centerX, height * 0.63, {
    size: height * 0.023,
    weight: "600",
    color: TEXT,
    maxWidth: width * 0.78,
  });

  const bottomXs = [width * 0.205, width * 0.5, width * 0.795];

  drawCentered(ctx, `Certificate No: ${data.certificateNumber}`, bottomXs[0], bottomBaselineY, {
    size: height * 0.017,
    weight: "600",
    maxWidth: width * 0.22,
    baseline: "alphabetic",
  });
  drawCentered(ctx, `Date: ${formatDate(data.completionDate)}`, bottomXs[1], bottomBaselineY, {
    size: height * 0.017,
    weight: "600",
    maxWidth: width * 0.18,
    baseline: "alphabetic",
  });
  drawCentered(ctx, `Score: ${data.finalExamScore}%`, bottomXs[2], bottomBaselineY, {
    size: height * 0.017,
    weight: "600",
    maxWidth: width * 0.16,
    baseline: "alphabetic",
  });
};

const drawHipaaCertificate = (ctx: CanvasRenderingContext2D, data: CertificateData, width: number, height: number) => {
  const centerX = width / 2;
  const contentMaxWidth = width * 0.72;
  const titleY = height * 0.234;
  const subtitleY = height * 0.276;
  const bottomBaselineY = height * 0.814;

  drawCentered(ctx, "CERTIFICATE OF ATTENDANCE", centerX, titleY, {
    size: Math.min(height * 0.043, 40),
    weight: "bold",
    family: "Playfair Display",
    color: NAVY,
    maxWidth: contentMaxWidth,
  });

  drawCentered(ctx, "Medical Interpreter Course", centerX, subtitleY, {
    size: Math.min(height * 0.022, 20),
    weight: "600",
    color: NAVY,
    maxWidth: contentMaxWidth,
  });

  drawCentered(ctx, "This is to certify that", centerX, height * 0.43, {
    size: height * 0.025,
    color: TEXT,
    maxWidth: contentMaxWidth,
  });

  drawCentered(ctx, data.userName, centerX, height * 0.525, {
    size: height * 0.065,
    weight: "bold",
    family: "Playfair Display",
    color: TEXT,
    maxWidth: width * 0.74,
  });

  drawCentered(ctx, "has attended HIPAA Training for Medical Interpretation", centerX, height * 0.63, {
    size: height * 0.023,
    weight: "600",
    color: TEXT,
    maxWidth: width * 0.78,
  });

  const bottomXs = [width * 0.298, width * 0.700];

  drawCentered(ctx, `Certificate No: ${data.certificateNumber}`, bottomXs[0], bottomBaselineY, {
    size: height * 0.017,
    weight: "600",
    maxWidth: width * 0.24,
    baseline: "alphabetic",
  });
  drawCentered(ctx, `Date: ${formatDate(data.completionDate)}`, bottomXs[1], bottomBaselineY, {
    size: height * 0.017,
    weight: "600",
    maxWidth: width * 0.2,
    baseline: "alphabetic",
  });
};

const drawVerificationQr = async (ctx: CanvasRenderingContext2D, data: CertificateData, width: number, height: number) => {
  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-certificate?certificateNumber=${data.certificateNumber}&verificationCode=${data.verificationCode}`;

  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: Math.round(width * 0.06),
    margin: 1,
    color: {
      dark: TEXT,
      light: "#FFFFFF",
    },
  });

  const qrImage = await loadImage(qrCodeDataUrl);
  const qrSize = Math.round(width * 0.065);
  ctx.drawImage(qrImage, width * 0.035, height * 0.795, qrSize, qrSize);
};

export const generateCertificate = async (data: CertificateData): Promise<string> => {
  try {
    const templateFileName = getTemplateFileName(data.certificateType);
    const templatePath = path.resolve(process.cwd(), "public", "certificates", "templates", templateFileName);
    console.log("Loading template from:", templatePath);

    const template = await loadImage(templatePath);
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(template, 0, 0, template.width, template.height);

    if (data.certificateType === "hipaa") {
      drawHipaaCertificate(ctx, data, template.width, template.height);
    } else {
      drawCourseCertificate(ctx, data, template.width, template.height);
    }

    await drawVerificationQr(ctx, data, template.width, template.height);

    const buffer = canvas.toBuffer("image/png");
    const normalizedType = data.certificateType === "hipaa" ? "hipaa" : "course";

    console.log("Uploading to Cloudinary...");

    const uploadResult = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "certificates",
          public_id: `${normalizedType}-${data.certificateNumber}`,
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
        },
      );

      uploadStream.end(buffer);
    });

    console.log("Certificate uploaded successfully:", uploadResult);
    return uploadResult;
  } catch (error) {
    console.error("Error generating certificate:", error);
    throw new Error("Failed to generate certificate");
  }
};
