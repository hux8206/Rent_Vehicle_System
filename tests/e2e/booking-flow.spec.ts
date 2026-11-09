import { test, expect } from '@playwright/test';

test.describe('E2E Flow: Đặt xe giữ chỗ 10 phút & Quét VietQR', () => {
  test.beforeEach(async ({ page }) => {
    // Tiền thiết lập cookie consent để không che chắn giao diện
    await page.addInitScript(() => {
      window.localStorage.setItem('vehiclerent_cookie_consent', 'accepted_test');
    });
  });

  test('Khách hàng đăng nhập -> Chọn xe -> Đặt xe giữ chỗ 10 phút -> Hiển thị mã VietQR', async ({ page }) => {
    // 1. Đăng nhập tài khoản Customer
    await page.goto('/login');
    await expect(page).toHaveTitle(/VehicleRent/i);

    // Điền form đăng nhập
    await page.fill('input[type="email"]', 'customer1@gmail.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');

    // Chờ điều hướng về trang chủ hoặc lưu session
    await page.waitForURL('http://localhost:3000/');
    await expect(page.getByRole('button', { name: /Nguyễn Hoàng Long/i })).toBeVisible({ timeout: 10000 });

    // 2. Chọn dòng xe (Honda Air Blade hoặc dòng xe trên trang chủ)
    // Click vào thẻ xe hoặc điều hướng thẳng đến trang chi tiết dòng xe
    const vehicleLink = page.locator('a[href^="/vehicles/"]').first();
    await expect(vehicleLink).toBeVisible({ timeout: 10000 });
    await vehicleLink.click();

    // Chờ trang chi tiết xe hiển thị
    await page.waitForURL(/\/vehicles\/\d+/);
    await expect(page.locator('h1')).toBeVisible();

    // 3. Mở Modal đặt xe
    const bookButton = page.locator('button:has-text("Xác nhận đặt xe & Giữ chỗ")');
    await expect(bookButton).toBeVisible({ timeout: 10000 });
    await expect(bookButton).toBeEnabled();
    await bookButton.click();

    // 4. Modal đặt xe xuất hiện (Bước 1/2)
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(modal.locator('text=Bước 1/2: Xác thực & Đặt xe')).toBeVisible();

    // Đồng ý Giấy phép lái xe chính chủ (Checkbox 1)
    const licenseCheckbox = modal.locator('input[type="checkbox"]').nth(0);
    await licenseCheckbox.check();
    await expect(licenseCheckbox).toBeChecked();

    // Đồng ý Nghị định 13: Điều khoản & Bảo mật (Checkbox 2)
    const termsCheckbox = modal.locator('input[type="checkbox"]').nth(1);
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();

    // Submit form đặt xe giữ chỗ 10 phút
    const submitBookingBtn = modal.locator('button[type="submit"][form="booking-form"]');
    await expect(submitBookingBtn).toBeEnabled();
    await submitBookingBtn.click();

    // 5. Kiểm tra chuyển sang Bước 2/2: Giữ xe 10 phút & Quét VietQR
    await expect(modal.locator('text=Bước 2/2: Giữ xe 10 phút & Quét VietQR')).toBeVisible({ timeout: 15000 });
    await expect(modal.locator('text=Thanh toán VietQR động')).toBeVisible();

    // Kiểm tra Banner đếm ngược 10 phút
    await expect(modal.locator('text=Thời gian giữ chỗ còn lại')).toBeVisible();
    await expect(modal.locator('text=Xe đã được tạm khóa. Quá 10 phút đơn sẽ tự động hủy.')).toBeVisible();

    // Kiểm tra đồng hồ đếm ngược có định dạng MM:SS (ví dụ 09:59 hoặc 10:00)
    const timerElement = modal.locator('text=/\\d{2}:\\d{2}/');
    await expect(timerElement).toBeVisible();

    // Kiểm tra mã VietQR hiển thị đúng trên màn hình
    const qrImage = modal.locator('img[alt*="Mã VietQR"]');
    await expect(qrImage).toBeVisible({ timeout: 10000 });

    const qrSrc = await qrImage.getAttribute('src');
    expect(qrSrc).toBeTruthy();
    expect(qrSrc).toMatch(/^(https?:\/\/|data:image\/)/);

    // Kiểm tra thông tin thanh toán VietQR hiển thị đầy đủ
    await expect(modal.locator('text=Số tiền cọc cần chuyển:')).toBeVisible();
    await expect(modal.locator('text=Nội dung chuyển khoản:')).toBeVisible();

    // Chụp ảnh màn hình làm bằng chứng kiểm thử thành công
    await page.screenshot({ path: 'test-results/vietqr-booking-success.png', fullPage: true });
  });
});
