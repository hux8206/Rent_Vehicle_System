import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const prismaPath = path.resolve(process.cwd(), "apps/api/node_modules/@prisma/client");
const { PrismaClient } = require(prismaPath);

// Đọc file .env.local
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = val;
    }
  }
  return env;
}

const webEnv = loadEnv(path.resolve(process.cwd(), "apps/web/.env.local"));
const apiEnv = loadEnv(path.resolve(process.cwd(), "apps/api/.env"));

const accountId = webEnv.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
const accessKeyId = webEnv.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = webEnv.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
const bucketName = webEnv.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;
const publicDomain = webEnv.R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicDomain) {
  console.error("❌ Vui lòng cấu hình đầy đủ biến R2 trong apps/web/.env.local trước khi chạy script!");
  console.error("Cần có: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN");
  process.exit(1);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: apiEnv.DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

const uploadsDir = path.resolve(process.cwd(), "apps/web/public/uploads");

async function migrate() {
  console.log("🚀 Bắt đầu quá trình đồng bộ ảnh từ local sang Cloudflare R2...");

  if (!fs.existsSync(uploadsDir)) {
    console.log("Thư mục apps/web/public/uploads trống hoặc không tồn tại.");
    return;
  }

  const files = fs.readdirSync(uploadsDir);
  console.log(`Tìm thấy ${files.length} tệp tin trong thư mục public/uploads.`);

  const domain = publicDomain.replace(/\/+$/, "");
  const uploadedMap = new Map(); // oldPath -> newUrl

  for (const filename of files) {
    const filePath = path.join(uploadsDir, filename);
    if (!fs.statSync(filePath).isFile()) continue;

    const fileBuffer = fs.readFileSync(filePath);
    const rawExt = filename.split(".").pop() || "jpg";
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };

    console.log(`Đang tải lên R2: ${filename}...`);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: fileBuffer,
        ContentType: mimeTypes[rawExt.toLowerCase()] || "image/jpeg",
      })
    );

    const oldPath = `/uploads/${filename}`;
    const newUrl = `${domain}/${filename}`;
    uploadedMap.set(oldPath, newUrl);
  }

  console.log("✅ Đã tải toàn bộ tệp tin lên Cloudflare R2 thành công!");

  // Cập nhật lại đường dẫn trong database qua Prisma
  console.log("🔄 Đang cập nhật URL trong cơ sở dữ liệu...");

  for (const [oldPath, newUrl] of uploadedMap.entries()) {
    // 1. Cập nhật bảng stores
    await prisma.store.updateMany({
      where: { storeImage: oldPath },
      data: { storeImage: newUrl },
    });
  }

  // 3. Cập nhật bảng vehicle_models (images Json)
  const models = await prisma.vehicleModel.findMany({
    where: { images: { not: null } },
  });

  for (const model of models) {
    if (Array.isArray(model.images)) {
      let changed = false;
      const updatedImages = model.images.map((img) => {
        if (uploadedMap.has(img)) {
          changed = true;
          return uploadedMap.get(img);
        }
        return img;
      });

      if (changed) {
        await prisma.vehicleModel.update({
          where: { id: model.id },
          data: { images: updatedImages },
        });
      }
    }
  }

  console.log("🎉 Hoàn tất di chuyển toàn bộ dữ liệu ảnh sang Cloudflare R2!");
}

migrate()
  .catch((err) => {
    console.error("❌ Lỗi khi di chuyển ảnh:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
