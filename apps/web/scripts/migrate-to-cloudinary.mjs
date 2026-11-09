import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const prismaPath = path.resolve(process.cwd(), "apps/api/node_modules/@prisma/client");
const { PrismaClient } = require(prismaPath);

// Đọc file cấu hình môi trường
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

const cloudName = webEnv.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = webEnv.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
const apiSecret = webEnv.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("❌ Vui lòng cấu hình đầy đủ Cloudinary trong apps/web/.env.local trước khi chạy script!");
  console.error("Cần có: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
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
  console.log("🚀 Bắt đầu quá trình đồng bộ ảnh từ local sang Cloudinary...");

  if (!fs.existsSync(uploadsDir)) {
    console.log("Thư mục apps/web/public/uploads trống hoặc không tồn tại.");
    return;
  }

  const files = fs.readdirSync(uploadsDir);
  console.log(`Tìm thấy ${files.length} tệp tin trong thư mục public/uploads.`);

  const uploadedMap = new Map(); // oldPath -> newUrl

  for (const filename of files) {
    const filePath = path.join(uploadsDir, filename);
    if (!fs.statSync(filePath).isFile()) continue;

    console.log(`Đang tải lên Cloudinary: ${filename}...`);
    const publicId = filename.replace(/\.[^/.]+$/, "");
    const oldPath = `/uploads/${filename}`;

    // Kiểm tra xem ảnh này thuộc dòng xe hay cửa hàng để phân bổ đúng thư mục
    const isModelImage = await prisma.vehicleModel.findFirst({
      where: { images: { not: null } },
    }).then(async () => {
      const models = await prisma.vehicleModel.findMany();
      return models.some(
        (m) => Array.isArray(m.images) && m.images.some((img) => typeof img === "string" && img.includes(filename))
      );
    }).catch(() => false);

    const targetFolder = isModelImage ? "vehiclerent/model_vehicle" : "vehiclerent/img_store";

    try {
      const res = await cloudinary.uploader.upload(filePath, {
        folder: targetFolder,
        public_id: publicId,
        resource_type: "auto",
      });

      const newUrl = res.secure_url;
      uploadedMap.set(oldPath, newUrl);
    } catch (uploadErr) {
      console.error(`Không thể tải ${filename}:`, uploadErr.message);
    }
  }

  console.log(`✅ Đã tải ${uploadedMap.size} tệp tin lên Cloudinary thành công!`);

  // Cập nhật lại đường dẫn trong database qua Prisma
  console.log("🔄 Đang cập nhật URL trong cơ sở dữ liệu...");

  for (const [oldPath, newUrl] of uploadedMap.entries()) {
    // 1. Cập nhật bảng stores (ảnh cửa hàng)
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

  console.log("🎉 Hoàn tất di chuyển toàn bộ dữ liệu ảnh sang Cloudinary!");
}

migrate()
  .catch((err) => {
    console.error("❌ Lỗi khi di chuyển ảnh:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
