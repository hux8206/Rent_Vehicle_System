# WORKSPACE RULES FOR ANTIGRAVITY AGENT

## 1. Source of Truth
- ALWAYS read `docs/business_flow_spec.md` and `apps/api/prisma/schema.prisma` before implementing any feature.
- Never invent or rename database columns outside `schema.prisma`.

## 2. Tech Stack Constraints
- Backend: NestJS (TypeScript), Prisma ORM, MySQL 8, BullMQ/Schedule for background jobs, `@payos/node` for VietQR payments.
- Frontend: Next.js (App Router, TypeScript), Tailwind CSS, Shadcn UI, TanStack Query (React Query), React Hook Form + Zod.

## 3. Critical Business & Security Rules
- **Money & Financial Safety**: Use `Decimal` for all monetary calculations (`rentPrice`, `rentAmount`, `depositAmount`, `commissionAmount`, `balance`, `creditLimit`). Never use floating-point math for money.
- **Race-Condition Prevention**: In `BookingsService.createBooking()`, ALWAYS wrap availability checks and booking creation inside `prisma.$transaction()` using interactive transactions or row-level locks (`SELECT ... FOR UPDATE`).
- **10-Minute Hold**: Every new booking starts with `status = 0` (`PendingPayment`) and `holdExpiresAt = NOW() + 10 minutes`. Availability queries MUST exclude vehicles locked by active holds (`status = 0 AND holdExpiresAt > NOW()`).
- **Partner Wallet & FIFO Queue**: When a payment webhook succeeds, check `wallet.balance - booking.commissionAmount >= -wallet.creditLimit`. If true, set `booking.status = 1` (`Confirmed`) and deduct commission. If false, set `booking.status = 2` (`WaitingQueue`). When a partner deposits money, process `WaitingQueue` bookings in strict `createdAt ASC` (FIFO) order.
- **Physical Vehicle Handover**: Customers book a `VehicleModel`. Partners must assign a specific available `VehicleItem` (`licensePlate`) during handover (`POST /api/partner/bookings/:id/handover`).
- **Role-Based Access Control**: Strictly enforce Guards for `0: Admin`, `1: Partner` (must own the `Store`), and `2: Customer` (must own the `Booking`).


