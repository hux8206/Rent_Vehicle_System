-- AlterTable stores:
--   1. Đổi cột status từ VARCHAR(50) sang INT (0=PENDING, 1=ACTIVE, 2=REJECTED)
--   2. Thêm cột storeImage VARCHAR(500) NULL
--   3. Thêm cột rejectReason VARCHAR(500) NULL

-- Bước 1: Thêm cột tạm để chuyển đổi dữ liệu
ALTER TABLE `stores` ADD COLUMN `status_new` INT NOT NULL DEFAULT 0;

-- Bước 2: Map dữ liệu cũ ('ACTIVE' -> 1, còn lại -> 0 PENDING)
UPDATE `stores` SET `status_new` = CASE
  WHEN `status` = 'ACTIVE' THEN 1
  ELSE 0
END;

-- Bước 3: Xoá cột cũ, đổi tên cột mới (MariaDB dùng CHANGE thay vì RENAME COLUMN)
ALTER TABLE `stores` DROP COLUMN `status`;
ALTER TABLE `stores` CHANGE `status_new` `status` INT NOT NULL DEFAULT 0;

-- Bước 4: Thêm các cột mới
ALTER TABLE `stores`
  ADD COLUMN `storeImage` VARCHAR(500) NULL,
  ADD COLUMN `rejectReason` VARCHAR(500) NULL;
