import { generateCertificate } from "../services/certificateGenerator";
import { createCanvas, loadImage, registerFont } from "canvas";
import cloudinary from "../config/cloudinary";
import QRCode from "qrcode";
import path from "path";

// Mock all dependencies
jest.mock("canvas");
jest.mock("../config/cloudinary");
jest.mock("qrcode");

describe("Certificate Generator Service Tests", () => {
  let mockCanvas: any;
  let mockContext: any;
  let mockTemplate: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      FRONTEND_URL: "https://test-app.com",
    };

    // Mock canvas context
    mockContext = {
      drawImage: jest.fn(),
      fillText: jest.fn(),
      textAlign: "",
      textBaseline: "",
      font: "",
      fillStyle: "",
    };

    // Mock canvas
    mockCanvas = {
      width: 2480,
      height: 1754,
      getContext: jest.fn().mockReturnValue(mockContext),
      toBuffer: jest.fn().mockReturnValue(Buffer.from("fake-png-data")),
    };

    // Mock template image
    mockTemplate = {
      width: 2480,
      height: 1754,
    };

    // Setup mocks
    (createCanvas as jest.Mock).mockReturnValue(mockCanvas);
    (loadImage as jest.Mock).mockResolvedValue(mockTemplate);
    (QRCode.toDataURL as jest.Mock).mockResolvedValue("data:image/png;base64,fake-qr-code");

    // Mock Cloudinary upload
    const mockUploadStream = {
      end: jest.fn((buffer) => {
        // Simulate successful upload
        const callback = (cloudinary.uploader.upload_stream as jest.Mock).mock.calls[0][1];
        callback(null, { secure_url: "https://cloudinary.com/certificate.png" });
      }),
    };

    (cloudinary.uploader.upload_stream as jest.Mock).mockReturnValue(mockUploadStream);

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  //*=====================================================
  //* SUCCESSFUL GENERATION TESTS
  //*=====================================================

  describe("Medical Certificate Generation", () => {
    test("should generate medical interpreter certificate", async () => {
      const certificateData = {
        userName: "John Doe",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2024-01-15"),
        certificateNumber: "MIC-2024-123456",
        verificationCode: "123456",
        finalExamScore: 95,
        certificateType: "medical" as const,
      };

      const result = await generateCertificate(certificateData);

      expect(result).toBe("https://cloudinary.com/certificate.png");
      expect(loadImage).toHaveBeenCalledWith(expect.stringContaining("medical-interpreter-certificate-bg.png"));
    });

    test("should load correct medical template", async () => {
      const certificateData = {
        userName: "Jane Smith",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2024-02-20"),
        certificateNumber: "MIC-2024-789012",
        verificationCode: "789012",
        finalExamScore: 88,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(loadImage).toHaveBeenCalledTimes(2); // Template + QR code
      const templateCall = (loadImage as jest.Mock).mock.calls[0][0];
      expect(templateCall).toContain("medical-interpreter-certificate-bg.png");
    });

    test("should draw user name on canvas", async () => {
      const certificateData = {
        userName: "Alice Johnson",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2024-03-10"),
        certificateNumber: "MIC-2024-345678",
        verificationCode: "345678",
        finalExamScore: 92,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(mockContext.fillText).toHaveBeenCalledWith("Alice Johnson", expect.any(Number), 645);
    });

    test("should draw certificate number", async () => {
      const certificateData = {
        userName: "Bob Williams",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2024-04-05"),
        certificateNumber: "MIC-2024-901234",
        verificationCode: "901234",
        finalExamScore: 85,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(mockContext.fillText).toHaveBeenCalledWith("MIC-2024-901234", 1020, 1150);
    });

    test("should format and draw completion date", async () => {
      const certificateData = {
        userName: "Carol Davis",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2024-05-15"),
        certificateNumber: "MIC-2024-567890",
        verificationCode: "567890",
        finalExamScore: 90,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      // Should format date as "May 15, 2024"
      expect(mockContext.fillText).toHaveBeenCalledWith(expect.stringMatching(/May 15, 2024/), 1370, 1150);
    });

    test("should set correct font for user name", async () => {
      const certificateData = {
        userName: "Eva Martinez",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2024-07-10"),
        certificateNumber: "MIC-2024-890123",
        verificationCode: "890123",
        finalExamScore: 93,
        certificateType: "medical" as const,
      };

      // Track all font assignments
      const fontAssignments: string[] = [];
      Object.defineProperty(mockContext, "font", {
        get: () => fontAssignments[fontAssignments.length - 1] || "",
        set: (value) => fontAssignments.push(value),
      });

      await generateCertificate(certificateData);

      // Check that Playfair Display font was set
      expect(fontAssignments).toContain("bold 72px 'Playfair Display'");
    });
  });

  describe("HIPAA Certificate Generation", () => {
    test("should generate HIPAA certificate", async () => {
      const certificateData = {
        userName: "Grace Lee",
        courseTitle: "HIPAA for Medical Interpreters",
        completionDate: new Date("2024-09-01"),
        certificateNumber: "HIPAA-2024-123456",
        verificationCode: "654321",
        finalExamScore: 94,
        certificateType: "hipaa" as const,
      };

      const result = await generateCertificate(certificateData);

      expect(result).toBe("https://cloudinary.com/certificate.png");
      expect(loadImage).toHaveBeenCalledWith(expect.stringContaining("hipaa-certificate-bg.png"));
    });

    test("should load correct HIPAA template", async () => {
      const certificateData = {
        userName: "Henry Taylor",
        courseTitle: "HIPAA for Medical Interpreters",
        completionDate: new Date("2024-10-15"),
        certificateNumber: "HIPAA-2024-789012",
        verificationCode: "210987",
        finalExamScore: 91,
        certificateType: "hipaa" as const,
      };

      await generateCertificate(certificateData);

      const templateCall = (loadImage as jest.Mock).mock.calls[0][0];
      expect(templateCall).toContain("hipaa-certificate-bg.png");
    });

    test("should not draw score for HIPAA certificate", async () => {
      const certificateData = {
        userName: "Iris Anderson",
        courseTitle: "HIPAA for Medical Interpreters",
        completionDate: new Date("2024-11-20"),
        certificateNumber: "HIPAA-2024-345678",
        verificationCode: "876543",
        finalExamScore: 96,
        certificateType: "hipaa" as const,
      };

      await generateCertificate(certificateData);

      // Should NOT call fillText with score percentage
      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      const hasScoreCall = fillTextCalls.some((call) => call[0].includes("%"));
      expect(hasScoreCall).toBe(false);
    });
  });

  //*=====================================================
  //* QR CODE GENERATION TESTS
  //*=====================================================

  describe("QR Code Generation", () => {
    test("should generate QR code with verification URL", async () => {
      const certificateData = {
        userName: "Jack Robinson",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2024-12-01"),
        certificateNumber: "MIC-2024-111222",
        verificationCode: "222111",
        finalExamScore: 87,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        "https://test-app.com/verify-certificate?certificateNumber=MIC-2024-111222&verificationCode=222111",
        expect.objectContaining({
          width: 120,
          margin: 1,
        })
      );
    });

    test("should use correct QR code colors", async () => {
      const certificateData = {
        userName: "Karen White",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-01-10"),
        certificateNumber: "MIC-2025-333444",
        verificationCode: "444333",
        finalExamScore: 90,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          color: {
            dark: "#2C2C2C",
            light: "#FFFFFF",
          },
        })
      );
    });

    test("should draw QR code on canvas", async () => {
      const certificateData = {
        userName: "Leo Harris",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-02-05"),
        certificateNumber: "MIC-2025-555666",
        verificationCode: "666555",
        finalExamScore: 92,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      // Should call drawImage for QR code (second call after template)
      expect(mockContext.drawImage).toHaveBeenCalledTimes(2);
      expect(mockContext.drawImage).toHaveBeenCalledWith(expect.any(Object), 480, 1030, 150, 150);
    });

    test("should use default frontend URL if not set", async () => {
      delete process.env.FRONTEND_URL;

      const certificateData = {
        userName: "Mia Clark",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-03-15"),
        certificateNumber: "MIC-2025-777888",
        verificationCode: "888777",
        finalExamScore: 88,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(QRCode.toDataURL).toHaveBeenCalledWith(expect.stringContaining("http://localhost:5173/verify-certificate"), expect.any(Object));
    });
  });

  //*=====================================================
  //* CLOUDINARY UPLOAD TESTS
  //*=====================================================

  describe("Cloudinary Upload", () => {
    test("should upload to Cloudinary with correct folder", async () => {
      const certificateData = {
        userName: "Noah Lewis",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-04-20"),
        certificateNumber: "MIC-2025-999000",
        verificationCode: "000999",
        finalExamScore: 94,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: "certificates",
          resource_type: "image",
          format: "png",
        }),
        expect.any(Function)
      );
    });

    test("should use correct public_id for medical certificate", async () => {
      const certificateData = {
        userName: "Olivia Walker",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-05-10"),
        certificateNumber: "MIC-2025-121212",
        verificationCode: "212121",
        finalExamScore: 96,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          public_id: "medical-MIC-2025-121212",
        }),
        expect.any(Function)
      );
    });

    test("should use correct public_id for HIPAA certificate", async () => {
      const certificateData = {
        userName: "Paul Young",
        courseTitle: "HIPAA for Medical Interpreters",
        completionDate: new Date("2025-06-15"),
        certificateNumber: "HIPAA-2025-343434",
        verificationCode: "434343",
        finalExamScore: 91,
        certificateType: "hipaa" as const,
      };

      await generateCertificate(certificateData);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          public_id: "hipaa-HIPAA-2025-343434",
        }),
        expect.any(Function)
      );
    });

    test("should upload PNG buffer", async () => {
      const certificateData = {
        userName: "Quinn King",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-07-25"),
        certificateNumber: "MIC-2025-565656",
        verificationCode: "656565",
        finalExamScore: 89,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(mockCanvas.toBuffer).toHaveBeenCalledWith("image/png");
    });

    test("should return Cloudinary secure URL", async () => {
      const certificateData = {
        userName: "Rachel Scott",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-08-30"),
        certificateNumber: "MIC-2025-787878",
        verificationCode: "878787",
        finalExamScore: 93,
        certificateType: "medical" as const,
      };

      const result = await generateCertificate(certificateData);

      expect(result).toBe("https://cloudinary.com/certificate.png");
    });
  });

  //*=====================================================
  //* ERROR HANDLING TESTS
  //*=====================================================

  describe("Error Handling", () => {
    test("should throw error if template loading fails", async () => {
      (loadImage as jest.Mock).mockRejectedValueOnce(new Error("Template not found"));

      const certificateData = {
        userName: "Sam Turner",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-09-10"),
        certificateNumber: "MIC-2025-909090",
        verificationCode: "090909",
        finalExamScore: 85,
        certificateType: "medical" as const,
      };

      await expect(generateCertificate(certificateData)).rejects.toThrow("Failed to generate certificate");
    });

    test("should throw error if QR code generation fails", async () => {
      (QRCode.toDataURL as jest.Mock).mockRejectedValueOnce(new Error("QR generation failed"));

      const certificateData = {
        userName: "Tina Hall",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-10-05"),
        certificateNumber: "MIC-2025-010101",
        verificationCode: "101010",
        finalExamScore: 87,
        certificateType: "medical" as const,
      };

      await expect(generateCertificate(certificateData)).rejects.toThrow("Failed to generate certificate");
    });

    test("should throw error if Cloudinary upload fails", async () => {
      const mockUploadStream = {
        end: jest.fn((buffer) => {
          const callback = (cloudinary.uploader.upload_stream as jest.Mock).mock.calls[0][1];
          callback(new Error("Cloudinary error"), null);
        }),
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockReturnValue(mockUploadStream);

      const certificateData = {
        userName: "Uma Patel",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-11-12"),
        certificateNumber: "MIC-2025-121314",
        verificationCode: "141312",
        finalExamScore: 90,
        certificateType: "medical" as const,
      };

      await expect(generateCertificate(certificateData)).rejects.toThrow("Failed to generate certificate");
    });

    test("should throw error if upload returns no result", async () => {
      const mockUploadStream = {
        end: jest.fn((buffer) => {
          const callback = (cloudinary.uploader.upload_stream as jest.Mock).mock.calls[0][1];
          callback(null, null); // No error, but also no result
        }),
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockReturnValue(mockUploadStream);

      const certificateData = {
        userName: "Victor Green",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2025-12-20"),
        certificateNumber: "MIC-2025-151617",
        verificationCode: "171615",
        finalExamScore: 92,
        certificateType: "medical" as const,
      };

      // Service catches all errors and throws generic message
      await expect(generateCertificate(certificateData)).rejects.toThrow("Failed to generate certificate");
    });
  });

  //*=====================================================
  //* CANVAS CONFIGURATION TESTS
  //*=====================================================

  describe("Canvas Configuration", () => {
    test("should create canvas with template dimensions", async () => {
      const certificateData = {
        userName: "Wendy Adams",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2026-01-08"),
        certificateNumber: "MIC-2026-181920",
        verificationCode: "201918",
        finalExamScore: 88,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(createCanvas).toHaveBeenCalledWith(2480, 1754);
    });

    test("should draw template as background", async () => {
      const certificateData = {
        userName: "Xander Miller",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2026-02-14"),
        certificateNumber: "MIC-2026-212223",
        verificationCode: "232221",
        finalExamScore: 95,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(mockContext.drawImage).toHaveBeenCalledWith(mockTemplate, 0, 0, 2480, 1754);
    });

    test("should set text alignment to center", async () => {
      const certificateData = {
        userName: "Yara Collins",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2026-03-19"),
        certificateNumber: "MIC-2026-242526",
        verificationCode: "262524",
        finalExamScore: 91,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(mockContext.textAlign).toBe("center");
    });

    test("should set text baseline to middle", async () => {
      const certificateData = {
        userName: "Zoe Bennett",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2026-04-22"),
        certificateNumber: "MIC-2026-272829",
        verificationCode: "292827",
        finalExamScore: 89,
        certificateType: "medical" as const,
      };

      await generateCertificate(certificateData);

      expect(mockContext.textBaseline).toBe("middle");
    });
  });
});
