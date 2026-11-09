import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// 1. Kiểm tra cấu hình Cloudinary
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function detectImageTypeFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // GIF: 47 49 46 38
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "gif";
  }

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Upload buffer lên Cloudinary bằng stream
function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = "vehiclerent/img_store"
): Promise<string> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const publicId = filename.replace(/\.[^/.]+$/, "");

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

// 2. Kiểm tra cấu hình Cloudflare R2
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderParam = (formData.get("folder") as string) || (formData.get("type") as string) || "";

    // Phân loại thư mục lưu trữ trên Cloudinary: img_store (ảnh cửa hàng) hoặc model_vehicle (ảnh dòng xe)
    let targetFolder = "vehiclerent/img_store";
    if (folderParam === "model_vehicle" || folderParam === "vehicle" || folderParam === "model") {
      targetFolder = "vehiclerent/model_vehicle";
    } else if (folderParam === "img_store" || folderParam === "store" || folderParam === "branch") {
      targetFolder = "vehiclerent/img_store";
    } else if (folderParam.startsWith("vehiclerent/")) {
      targetFolder = folderParam;
    } else if (folderParam) {
      targetFolder = `vehiclerent/${folderParam}`;
    }

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn hoặc chụp ảnh tải lên" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Kích thước ảnh vượt quá giới hạn cho phép (tối đa 5MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const detectedExt = detectImageTypeFromMagicBytes(buffer);
    if (!detectedExt) {
      return NextResponse.json(
        { error: "Định dạng file không hợp lệ. Chỉ chấp nhận các định dạng ảnh hợp lệ (JPEG, PNG, WEBP, GIF)" },
        { status: 400 }
      );
    }

    const filename = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${detectedExt}`;

    // --- Ưu tiên 1: Đẩy lên Cloudinary nếu có cấu hình ---
    if (isCloudinaryConfigured()) {
      try {
        const secureUrl = await uploadToCloudinary(buffer, filename, targetFolder);
        return NextResponse.json({ url: secureUrl, success: true, storage: "cloudinary", folder: targetFolder });
      } catch (cloudErr: any) {
        console.error("Cloudinary upload error:", cloudErr);
        // Nếu lỗi Cloudinary có thể tiếp tục thử các phương án khác hoặc báo lỗi
        throw new Error(`Lỗi tải ảnh lên Cloudinary: ${cloudErr.message || cloudErr}`);
      }
    }

    // --- Ưu tiên 2: Đẩy lên Cloudflare R2 nếu có cấu hình ---
    const r2Client = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;

    if (r2Client && bucketName && publicDomain) {
      const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        heic: "image/heic",
      };

      const key = `${targetFolder}/${filename}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: file.type || mimeTypes[detectedExt] || "image/jpeg",
        })
      );

      const domain = publicDomain.replace(/\/+$/, "");
      const url = `${domain}/${key}`;

      return NextResponse.json({ url, success: true, storage: "r2", folder: targetFolder });
    }

    // --- Phương án dự phòng: Lưu cục bộ vào public/uploads nếu chưa cấu hình Cloud ---
    const subfolder = targetFolder.replace(/^vehiclerent\/?/, "") || "img_store";
    const uploadsDir = path.join(process.cwd(), "public", "uploads", subfolder);
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);
    const url = `/uploads/${subfolder}/${filename}`;

    return NextResponse.json({ url, success: true, storage: "local", folder: targetFolder });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Không thể tải ảnh lên" },
      { status: 500 }
    );
  }
}
