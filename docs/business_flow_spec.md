# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ & KIẾN TRÚC HỆ THỐNG CHO AI AGENT
**Dự án:** Hệ thống Nền tảng Cho thuê xe trực tuyến Đa đối tác (Multi-vendor Vehicle Rental Platform)  
**Mục đích:** File tài liệu bối cảnh nghiệp vụ (System Business Context) chuẩn hóa để hướng dẫn các AI Coding Agent (Cursor, Claude Code, Windsurf, Copilot, Roo Code, v.v.) hiểu toàn diện luồng nghiệp vụ, cấu trúc dữ liệu và quy tắc logic khi sinh code.

---

## 1. TỔNG QUAN HỆ THỐNG & MÔ HÌNH HOẠT ĐỘNG

Hệ thống hoạt động theo mô hình sàn thương mại điện tử kết nối 3 đối tượng:
1. **Customer (Khách thuê xe):** Tìm kiếm, giữ chỗ tạm thời (10 phút), thanh toán cọc/toàn bộ qua VietQR động, nhận xe và đánh giá sau khi hoàn thành.
2. **Partner (Đối tác / Chủ nhà xe):** Đăng ký cửa hàng, quản lý danh mục dòng xe và khai báo biển số xe cụ thể, bàn giao xe cho khách, sở hữu Ví đối tác để bị sàn trừ tiền hoa hồng theo từng đơn.
3. **Admin (Quản trị viên sàn):** Kiểm duyệt đối tác, quản lý người dùng, theo dõi số dư ví đối tác, ẩn đánh giá vi phạm, xem thống kê doanh thu và cấu hình hệ thống.
4. **System Worker (Tiến trình ngầm / Cron Job):** Kiểm tra xung đột giữ xe theo thời gian thực, tự động hủy phiên giữ xe sau 10 phút, tự động đối soát thanh toán qua Webhook, kiểm tra hạn mức âm của ví đối tác và xử lý hàng chờ đơn theo cơ chế FIFO.

---

## 2. QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)

### BR1. Mô hình Phương tiện 2 tầng (Two-level Vehicle Inventory)
* **Tầng 1 - Dòng xe (`VehicleModel`):** Khái niệm trừu tượng (VD: Honda Air Blade 125cc, Yamaha Exciter 150). Chứa tên, thương hiệu, loại xe, đơn giá thuê theo ngày, hình ảnh, thông số kỹ thuật. Khách hàng xem và đặt xe dựa trên dòng xe này.
* **Tầng 2 - Xe vật lý cụ thể (`VehicleItem`):** Mỗi xe vật lý đại diện cho 1 chiếc xe ngoài đời thực có `licensePlate` (Biển số xe), `color` (Màu sắc), `chassisNumber` (Số khung) và `currentStatus` (0: Available, 1: Reserved, 2: Rented, 3: Maintenance).
* **Số lượng xe khả dụng (Availability Rule):** Tổng số xe của một dòng xe bằng tổng số `VehicleItem` gắn với `modelID` đó. Trong một khoảng thời gian $[T_{start}, T_{end}]$, số lượng xe có thể cho thuê = (Tổng số xe không bị bảo dưỡng) - (Số xe đã có đơn `Confirmed`, `ActiveRental` hoặc đang trong phiên giữ chỗ `PendingPayment` hợp lệ trùng khoảng thời gian).

### BR2. Cơ chế Giữ chỗ 10 phút chống xung đột (10-Minute Hold Mechanism)
* Khách bấm "Xác nhận đặt xe" $\rightarrow$ Hệ thống tạo đơn `Booking` với trạng thái `0: PendingPayment`, đồng thời gán trường `holdExpiresAt = NOW() + 10 phút`.
* Trong vòng 10 phút này, số lượng xe khả dụng của dòng xe đó bị trừ đi tạm thời để đảm bảo không bị khách khác tranh chỗ (Race-condition / Double-booking prevention).
* **Nếu thanh toán thành công trong 10 phút:** Đơn chuyển sang `1: Confirmed`, giữ chỗ chính thức thành công.
* **Nếu quá 10 phút không có Webhook thanh toán:** Worker ngầm hoặc middleware tự động chuyển đơn sang `5: Cancelled` (hoặc `Expired`), xe tự động được nhả về kho khả dụng.

### BR3. Thanh toán Trực tuyến Tự động qua Webhook & VietQR
* Hệ thống **không dùng cơ chế duyệt thủ công bằng ảnh chụp màn hình**.
* Khi tạo đơn, hệ thống sinh mã VietQR động chứa chính xác số tiền cần thanh toán và nội dung chuyển khoản duy nhất (`transactionRef`, VD: `THUEXE_1082`).
* Cổng thanh toán (như PayOS, SePay, VNPay) nhận được tiền sẽ bắn tín hiệu `Webhook` (HTTP POST) về server.
* Server kiểm tra chữ ký (Signature/Checksum), lấy `transactionRef`, đối soát đúng số tiền $\rightarrow$ Cập nhật `Payment` sang `Success` và đơn `Booking` sang `Confirmed`.

### BR4. Ví Đối tác, Hoa hồng Sàn & Hàng chờ Đơn FIFO
* Mỗi Partner sở hữu 1 Ví đối tác (`PartnerWallet`) có `balance` (số dư) và `creditLimit` (hạn mức cho phép số dư âm, VD: `-500,000 VNĐ`).
* **Tính hoa hồng:** Mỗi đơn đặt thuê phát sinh phí hoa hồng sàn (`commissionAmount`).
* **Điều kiện tiếp nhận đơn:** 
  $$\text{Số dư hiện tại} - \text{Hoa hồng đơn mới} \ge -\text{creditLimit}$$
  * *Nếu đủ điều kiện:* Đơn được tiếp nhận bình thường (`Confirmed`).
  * *Nếu vượt quá hạn mức nợ (Số dư quá thấp):* Đơn bị đưa vào trạng thái `2: WaitingQueue` (Hàng chờ). Đối tác không được nhận đơn mới cho đến khi nạp tiền.
* **Cơ chế nạp tiền & xử lý FIFO:** Khi đối tác nạp tiền vào ví (`deposit`), hệ thống quét danh sách các đơn trong `WaitingQueue` của đối tác đó theo thứ tự **FIFO (Đơn nào đặt trước xử lý trước)**. Nếu số dư đủ bù hoa hồng đơn nào thì tự động đẩy đơn đó sang `Confirmed` và trừ hoa hồng tương ứng.

### BR5. Bàn giao & Thu hồi xe theo Biển số thực tế
* Khi khách đến nhận xe (UC12), đối tác mở chi tiết đơn, hệ thống hiển thị danh sách các biển số xe (`VehicleItem`) của dòng xe đó đang có trạng thái `Available`.
* Đối tác bắt buộc phải **chọn 1 biển số xe cụ thể** để bàn giao $\rightarrow$ Hệ thống gán `vehicleID` đó vào `BookingDetail`, cập nhật xe sang `2: Rented`, cập nhật đơn sang `3: ActiveRental`.
* Khi khách trả xe, đối tác bấm "Xác nhận nhận lại xe" $\rightarrow$ Cập nhật xe về `0: Available`, cập nhật đơn sang `4: Completed`, cho phép khách hàng đánh giá (`Review`).

---

## 3. MÔ HÌNH DỮ LIỆU & ENTITY SPECIFICATIONS (CHO ORM/DATABASE)

Thiết kế cơ sở dữ liệu tối ưu theo mô hình quan hệ (RDBMS) gồm 12 bảng chính:

```
[users] 1 --- * [stores] 1 --- * [vehicle_models] 1 --- * [vehicle_items]
   |                |                                          |
   |                |-----------------------*                  |
   |                                        |                  |
   * (Customer)                             *                  *
[bookings] 1 ----------------------- * [booking_details] ------|
   |   \
   |    \--- 1 [payments]
   |
   |--- 0..1 [reviews]

[users] (Partner) 1 --- 1 [partner_wallets] 1 --- * [wallet_histories]
[users] 1 --- * [notifications]
[stores] 1 --- 1 [rental_policies]
```

### Chi tiết các thực thể (Entities & Fields)

#### 1. Entity `User` (Bảng `users` - Single Table Inheritance)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `email: VARCHAR(255) UNIQUE NOT NULL`
* `passwordHash: VARCHAR(255) NOT NULL`
* `fullName: VARCHAR(150) NOT NULL`
* `phone: VARCHAR(20) NOT NULL`
* `role: INT NOT NULL` (0: Admin, 1: Partner, 2: Customer)
* `status: BOOLEAN DEFAULT TRUE` (true: Active, false: Locked)
* `driverLicense: VARCHAR(50) NULL` (Dành riêng cho Customer)
* `bankAccountNum: VARCHAR(50) NULL` (Dành riêng cho Partner)
* `bankName: VARCHAR(100) NULL` (Dành riêng cho Partner)
* `createdAt: TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

#### 2. Entity `Store` (Bảng `stores`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `partnerId: INT NOT NULL` (FK $\rightarrow$ `users.id`)
* `storeName: VARCHAR(255) NOT NULL`
* `address: VARCHAR(500) NOT NULL`
* `phoneContact: VARCHAR(20) NOT NULL`
* `description: TEXT NULL`
* `status: VARCHAR(50) DEFAULT 'ACTIVE'`

#### 3. Entity `RentalPolicy` (Bảng `rental_policies`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `storeId: INT UNIQUE NOT NULL` (FK $\rightarrow$ `stores.id`)
* `depositPercent: DECIMAL(5,2) NOT NULL` (Ví dụ 30.00 = 30%)
* `cancelRule: TEXT NULL`
* `refundCondition: TEXT NULL`

#### 4. Entity `VehicleModel` (Bảng `vehicle_models`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `storeId: INT NOT NULL` (FK $\rightarrow$ `stores.id`)
* `name: VARCHAR(255) NOT NULL` (VD: "Honda Air Blade 125cc")
* `brand: VARCHAR(100) NOT NULL` (VD: "Honda", "Yamaha")
* `type: INT NOT NULL` (0: Xe số, 1: Tay ga, 2: Côn tay/PKL, 3: Xe điện/Ô tô)
* `rentPrice: DECIMAL(12,2) NOT NULL` (Giá thuê theo ngày 24h)
* `specifications: TEXT NULL`
* `images: JSON NULL` (Mảng URL ảnh xe)

#### 5. Entity `VehicleItem` (Bảng `vehicle_items`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `modelId: INT NOT NULL` (FK $\rightarrow$ `vehicle_models.id`)
* `licensePlate: VARCHAR(20) UNIQUE NOT NULL` (Biển số xe: VD "43B1-999.88")
* `color: VARCHAR(50) NULL`
* `chassisNumber: VARCHAR(50) NULL`
* `status: INT DEFAULT 0` (0: Available, 1: Reserved, 2: Rented, 3: Maintenance)

#### 6. Entity `Booking` (Bảng `bookings`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `bookingCode: VARCHAR(50) UNIQUE NOT NULL` (VD: "BK-202611-0012")
* `customerId: INT NOT NULL` (FK $\rightarrow$ `users.id`)
* `storeId: INT NOT NULL` (FK $\rightarrow$ `stores.id`)
* `startTime: DATETIME NOT NULL`
* `endTime: DATETIME NOT NULL`
* `pickupType: INT DEFAULT 0` (0: AtStore, 1: Delivery)
* `deliveryAddress: VARCHAR(500) NULL`
* `dayRent: DECIMAL(5,2) NOT NULL` (Số ngày thuê tính theo mốc 24h)
* `rentAmount: DECIMAL(12,2) NOT NULL` (Tổng tiền thuê xe)
* `depositAmount: DECIMAL(12,2) NOT NULL` (Tiền cọc cần thanh toán)
* `commissionAmount: DECIMAL(12,2) NOT NULL` (Tiền hoa hồng sàn sẽ trừ của đối tác)
* `holdExpiresAt: DATETIME NULL` (Mốc hết hạn giữ xe 10 phút)
* `status: INT DEFAULT 0` (0: PendingPayment, 1: Confirmed, 2: WaitingQueue, 3: ActiveRental, 4: Completed, 5: Cancelled)
* `createdAt: TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

#### 7. Entity `BookingDetail` (Bảng `booking_details`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `bookingId: INT NOT NULL` (FK $\rightarrow$ `bookings.id`)
* `modelId: INT NOT NULL` (FK $\rightarrow$ `vehicle_models.id`)
* `vehicleItemId: INT NULL` (FK $\rightarrow$ `vehicle_items.id`, gán khi bàn giao xe)
* `quantity: INT DEFAULT 1`
* `pricePerUnit: DECIMAL(12,2) NOT NULL`
* `subTotal: DECIMAL(12,2) NOT NULL`

#### 8. Entity `PartnerWallet` (Bảng `partner_wallets`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `partnerId: INT UNIQUE NOT NULL` (FK $\rightarrow$ `users.id`)
* `balance: DECIMAL(12,2) DEFAULT 0.00`
* `creditLimit: DECIMAL(12,2) DEFAULT 500000.00` (Hạn mức nợ cho phép, mặc định 500k)
* `status: INT DEFAULT 1` (1: Active, 0: Frozen)

#### 9. Entity `WalletHistory` (Bảng `wallet_histories`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `walletId: INT NOT NULL` (FK $\rightarrow$ `partner_wallets.id`)
* `bookingId: INT NULL` (FK $\rightarrow$ `bookings.id`)
* `type: INT NOT NULL` (0: Deposit/Nạp tiền, 1: Commission_Deduction/Trừ hoa hồng, 2: Refund/Hoàn tiền)
* `amount: DECIMAL(12,2) NOT NULL`
* `balanceBefore: DECIMAL(12,2) NOT NULL`
* `balanceAfter: DECIMAL(12,2) NOT NULL`
* `description: VARCHAR(255) NOT NULL`
* `createdAt: TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

#### 10. Entity `Payment` (Bảng `payments`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `bookingId: INT NOT NULL` (FK $\rightarrow$ `bookings.id`)
* `transactionRef: VARCHAR(100) UNIQUE NOT NULL` (Mã nội dung thanh toán VietQR)
* `paymentMethod: INT DEFAULT 1` (0: Cash, 1: BankTransfer/VietQR)
* `paymentType: INT NOT NULL` (0: FullPayment, 1: DepositOnly)
* `amount: DECIMAL(12,2) NOT NULL`
* `paymentStatus: INT DEFAULT 0` (0: Pending, 1: Success, 2: Failed)
* `paymentTime: DATETIME NULL`
* `createdAt: TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

#### 11. Entity `Review` (Bảng `reviews`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `bookingId: INT UNIQUE NOT NULL` (FK $\rightarrow$ `bookings.id`)
* `customerId: INT NOT NULL` (FK $\rightarrow$ `users.id`)
* `storeId: INT NOT NULL` (FK $\rightarrow$ `stores.id`)
* `rateStar: INT NOT NULL` (1 đến 5 sao)
* `comment: TEXT NULL`
* `isHidden: BOOLEAN DEFAULT FALSE`
* `hiddenReason: VARCHAR(255) NULL`
* `createdAt: TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

#### 12. Entity `Notification` (Bảng `notifications`)
* `id: INT PRIMARY KEY AUTO_INCREMENT`
* `recipientId: INT NOT NULL` (FK $\rightarrow$ `users.id`)
* `title: VARCHAR(255) NOT NULL`
* `content: TEXT NOT NULL`
* `isRead: BOOLEAN DEFAULT FALSE`
* `createdAt: TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

## 4. CHI TIẾT CÁC LUỒNG THI CÔNG (STEP-BY-STEP IMPLEMENTATION FLOWS)

### Flow 1: Kiểm tra xe khả dụng theo khoảng thời gian
* **Mục đích:** Đảm bảo không cho khách đặt xe nếu không còn xe rảnh.
* **Thuật toán truy vấn:**
  ```sql
  -- Số xe bận = tổng số xe có đơn đang Confirmed / ActiveRental hoặc đang giữ chỗ 10 phút
  SELECT COUNT(bd.id) 
  FROM booking_details bd
  JOIN bookings b ON bd.bookingId = b.id
  WHERE bd.modelId = :modelId
    AND (
      (b.status IN (1, 3)) -- Confirmed, ActiveRental
      OR (b.status = 0 AND b.holdExpiresAt > NOW()) -- Đang giữ chỗ chưa hết hạn
    )
    AND (b.startTime < :requestEndTime AND b.endTime > :requestStartTime);
  ```
* **Số xe khả dụng:**
  $$\text{AvailableCount} = \text{TotalActiveVehicleItems} - \text{BusyVehicleCount}$$

### Flow 2: Đặt xe & Giữ chỗ 10 phút (Checkout Flow)
1. Khách gửi payload: `modelId`, `storeId`, `startTime`, `endTime`, `pickupType`, `deliveryAddress`, `paymentType`.
2. Backend mở Transaction:
   * Kiểm tra $\text{AvailableCount} \ge \text{quantity}$. Nếu không đủ $\rightarrow$ Throw Exception: `XE_KHONG_KHA_DUNG`.
   * Tính `dayRent = CEIL(DATEDIFF_IN_HOURS(endTime, startTime) / 24)`.
   * Tính `rentAmount = dayRent * model.rentPrice`.
   * Tính `depositAmount = rentAmount * (policy.depositPercent / 100)`.
   * Tính `commissionAmount = rentAmount * 0.10` (Ví dụ 10% hoa hồng sàn).
   * Tạo record `Booking` với `status = 0 (PendingPayment)`, `holdExpiresAt = NOW() + INTERVAL 10 MINUTE`.
   * Tạo record `BookingDetail`.
   * Sinh `transactionRef = "TX" + booking.id + "_" + RANDOM_HEX(4)`.
   * Tạo record `Payment` với `transactionRef`, `amount = depositAmount` (hoặc `rentAmount`), `paymentStatus = 0 (Pending)`.
3. Trả về cho Client: Link/Mã VietQR động chứa `transactionRef`, số tiền và timestamp hết hạn đếm ngược 10 phút.

### Flow 3: Tiếp nhận Webhook Thanh toán (Payment Webhook Receiver)
1. Endpoint API: `POST /api/webhooks/payment`
2. **Bảo mật:** Validate `x-api-key` hoặc chữ ký mã hóa từ cổng thanh toán (PayOS / SePay).
3. Lấy `transactionRef` và `paidAmount` từ body webhook.
4. Mở Transaction:
   * Tìm `Payment` theo `transactionRef`. Nếu không tìm thấy hoặc đã `Success` $\rightarrow$ Return HTTP 200 (Idempotency check).
   * Kiểm tra `paidAmount == payment.amount`.
   * Cập nhật `payment.paymentStatus = 1 (Success)`, `payment.paymentTime = NOW()`.
   * Lấy đơn `Booking` tương ứng:
     * Kiểm tra số dư ví đối tác (`PartnerWallet`):
       $$\text{balance} - \text{commissionAmount} \ge -\text{creditLimit}$$
       * **Nếu ĐỦ:** 
         * `booking.status = 1 (Confirmed)`.
         * Trừ tiền hoa hồng ví: `wallet.balance -= commissionAmount`.
         * Ghi 1 bản ghi vào `WalletHistory` (Type = `Commission_Deduction`).
         * Gửi thông báo cho Partner và Customer.
       * **Nếu THIẾU:**
         * `booking.status = 2 (WaitingQueue)` (Hàng chờ do đối tác hết hạn mức).
         * Gửi thông báo cảnh báo cho Partner: *"Bạn có đơn thuê mới nhưng số dư không đủ trừ hoa hồng, vui lòng nạp tiền để tiếp nhận đơn"*.
5. Return HTTP 200 JSON `{ success: true }`.

### Flow 4: Background Job quét hết hạn giữ chỗ (Hold Expiry Worker)
* **Tần suất chạy:** Chạy mỗi 1 phút (Cron Job / Background Worker).
* **Nhiệm vụ:**
  ```sql
  UPDATE bookings 
  SET status = 5 -- Cancelled
  WHERE status = 0 -- PendingPayment
    AND holdExpiresAt <= NOW();
  ```
* Sau khi đổi trạng thái sang `Cancelled`, các xe thuộc đơn này tự động khả dụng trở lại cho khách khác mà không cần thao tác thủ công.

### Flow 5: Đối tác nạp tiền Ví & Xử lý Hàng chờ FIFO
1. Đối tác tạo yêu cầu nạp tiền: Tạo giao dịch nạp, thanh toán xong.
2. Webhook nạp tiền thành công:
   * `wallet.balance += depositAmount`.
   * Ghi log `WalletHistory` (Type = `Deposit`).
3. **Kích hoạt hàm xử lý hàng chờ FIFO:**
   * Lấy danh sách các đơn `WaitingQueue` của đối tác này sắp xếp theo thời gian tăng dần:
     ```sql
     SELECT * FROM bookings 
     WHERE storeId IN (SELECT id FROM stores WHERE partnerId = :partnerId)
       AND status = 2 -- WaitingQueue
     ORDER BY createdAt ASC;
     ```
   * Duyệt từng đơn:
     * Nếu $\text{wallet.balance} - \text{booking.commissionAmount} \ge -\text{wallet.creditLimit}$:
       * Trừ tiền: $\text{wallet.balance} -= \text{booking.commissionAmount}$.
       * Chuyển `booking.status = 1 (Confirmed)`.
       * Ghi log `WalletHistory`.
       * Bắn thông báo xác nhận cho khách hàng và đối tác.
     * Nếu không đủ tiền $\rightarrow$ Dừng vòng lặp (Break).

### Flow 6: Bàn giao xe & Hoàn tất thuê xe
1. **Bàn giao xe (Handover):**
   * Endpoint: `POST /api/partner/bookings/:id/handover`
   * Body: `{ vehicleItemId: 12 }` (Biển số xe đối tác chọn).
   * Validate: Đơn phải ở trạng thái `1: Confirmed`, xe được chọn phải có `modelId` khớp với đơn và `status = 0: Available`.
   * Update:
     * `booking_details.vehicleItemId = 12`.
     * `vehicle_items.status = 2 (Rented)`.
     * `bookings.status = 3 (ActiveRental)`.
2. **Khách trả xe (Return):**
   * Endpoint: `POST /api/partner/bookings/:id/complete`
   * Update:
     * `vehicle_items.status = 0 (Available)`.
     * `bookings.status = 4 (Completed)`.
   * Gửi thông báo cho Customer mời để lại đánh giá (`Review`).

---

## 5. HƯỚNG DẪN DÀNH CHO AI AGENT KHI SINH CODE

1. **Chuẩn hóa API RESTful:**
   * `/api/auth/...`: Login, Register, Profile cho User.
   * `/api/customer/vehicles/...`: Tìm kiếm, xem chi tiết dòng xe.
   * `/api/customer/bookings/...`: Tạo đơn, giữ chỗ, lịch sử thuê.
   * `/api/partner/vehicles/...`: Quản lý Model và Vehicle Items (biển số xe).
   * `/api/partner/wallet/...`: Xem số dư, nạp tiền, xem lịch sử giao dịch.
   * `/api/webhooks/payment`: Tiếp nhận callback từ VietQR/Cổng thanh toán.
2. **Xử lý Race-Condition:**
   * Khi tạo phiên giữ chỗ `Booking`, bắt buộc bọc trong **Database Transaction** và sử dụng `SELECT ... FOR UPDATE` khi đọc số lượng xe khả dụng.
3. **Phân quyền chặt chẽ (Guards / Middleware):**
   * Role `0: Admin`: Quản lý toàn quyền.
   * Role `1: Partner`: Chỉ được sửa thông tin xe, đơn thuê thuộc các `stores` do chính mình sở hữu.
   * Role `2: Customer`: Chỉ được xem và hủy các `bookings` do chính mình tạo.
