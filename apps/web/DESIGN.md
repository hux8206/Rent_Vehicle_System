VehicleRent Platform - Design System & Animation Specifications

1. Overview & Aesthetic Direction

VehicleRent Platform blends high-octane automotive dynamics with sleek, modern fintech clarity (inspired by Turo, Tesla Mobility, and Linear). The interface feels tactile, fluid, and premium — every card responds with depth, every button has weighted spring physics, and key transactional moments (10-minute hold, VietQR payment) are celebrated with smooth micro-interactions.

2. Color Palette (Automotive Tech & High Contrast)

Primary & Brand Colors

Electric Cyan (#06B6D4 / cyan-500): Primary actions, active highlights, live vehicle status.

Cyan Hover (#0891B2 / cyan-600): Hover & focused states.

Cyan Glow Base (rgba(6, 182, 212, 0.25)): Subtle ambient colored glow.

Deep Midnight (#0F172A / slate-900): Dark headers, contrast surfaces, hero backdrop.

Obsidian Dark (#020617 / slate-950): Deep dark navbar and modal overlays.

Accent & Energy Colors

Amber Gold (#F59E0B / amber-500): Star ratings (4.95★), verified badges, premier cars.

Velocity Orange (#F97316 / orange-500): Flash sales, urgent alerts, 10-minute hold countdown timer.

Emerald Pulse (#10B981 / emerald-500): 100% Available badge, instant handover confirmation, success toast.

Crimson Alert (#EF4444 / rose-500): Expired hold, payment failed, out-of-stock tag.

Neutrals & Surfaces

Surface Canvas (#F8FAFC / slate-50): Soft clean background.

Surface Card (#FFFFFF): Pristine white vehicle card containers.

Surface Muted (#F1F5F9 / slate-100): Tab pills, input box surfaces, table alternating stripes.

Border Subtle (#E2E8F0 / slate-200): Crisp 1px container dividers.

3. Typography & Font Hierarchy

Font Family: Inter, Plus Jakarta Sans, or Geist Sans with Tailwind typography.

Display Hero: 48px to 56px, Extra Bold (800), tracking -0.03em.

h1 / Section Titles: 32px to 36px, Bold (700), tracking -0.02em.

h2 / Vehicle Names: 20px to 24px, Semi-Bold (600).

Body Regular: 15px to 16px, Regular (400), line-height 1.6.

Metadata & Specs: 12px to 13px, Medium (500), uppercase tracking +0.05em.

4. Spacing & Elevation (Colored Glow System)

Spacing Scale

space-xs: 4px (tight badge gap)

space-sm: 8px (icon to text gap)

space-md: 16px (card inner padding)

space-lg: 24px (grid gap between vehicle cards)

space-xl: 40px to 64px (section margins)

Border Radii

Tags & Pills: rounded-full (9999px) for category filters, status chips.

Buttons: rounded-xl (12px) or rounded-full for primary CTAs.

Cards & Modals: rounded-2xl (16px to 20px) for vehicle cards and checkout popups.

Colored Elevation (Glow Shadows)

shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.05)

shadow-card-hover: 0 12px 30px -10px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(6, 182, 212, 0.08)

shadow-cyan-glow: 0 8px 25px -4px rgba(6, 182, 212, 0.35)

shadow-amber-glow: 0 8px 20px -4px rgba(245, 158, 11, 0.35)

shadow-orange-glow: 0 8px 20px -4px rgba(249, 115, 22, 0.35)

5. Micro-Interactions & Animation Patterns (Framer Motion)

A. 3D Tilt Hover Effect on Vehicle Cards

Behavior: When hovering over a vehicle card, the card subtly tilts in 3D perspective based on mouse coordinates.

Parameters: rotateX max ±5deg, rotateY max ±5deg, scale 1.02, smooth transition damping: 20.

Specular Highlight: A subtle glossy linear-gradient sheen follows the cursor across the top of the card.

B. Spring Physics on Interactive Elements

Primary CTAs ("Tìm xe ngay", "Đặt xe giữ chỗ 10p"):

whileHover={{ scale: 1.02 }}

whileTap={{ scale: 0.96 }}

transition={{ type: "spring", stiffness: 400, damping: 17 }}

Category Filter Pills: Smooth layout transition with layoutId="activeFilterTab".

C. 10-Minute Hold Pulse (Checkout & Payment Modal)

Timer Badge: The remaining countdown clock (09:42) features a subtle heartbeat glow:

Keyframes: scale: [1, 1.03, 1], opacity: [0.9, 1, 0.9] every 1.5 seconds.

Border oscillates with shadow-orange-glow.

D. Scroll-Triggered Stagger Reveal

Vehicle Catalog Grid: When the user scrolls down to the vehicle showcase:

Container variants: staggerChildren: 0.08.

Child variants: initial={{ opacity: 0, y: 24 }}, animate={{ opacity: 1, y: 0 }}.

E. Floating Badges (Hero Showcase)

Floating badges ("4.95★", "Bàn giao xe nhanh"):

Gentle continuous float: y: [0, -6, 0], duration 3.5s, ease easeInOut, loop Infinity.

6. Key Component Blueprints

1. Vehicle Card (Showroom Item)

Header: High-resolution image (angled 45°), top-left category badge (e.g., "Tay Ga • 125cc"), top-right live availability dot ("🟢 3 xe sẵn sàng").

Body: Vehicle name, partner/store name with location pin, spec chips (Xăng/Điện, Cốp rộng, Smartkey).

Footer: Daily rental price in bold, accompanied by an instant "Xem chi tiết & Đặt" button with cyan hover glow.

2. Floating Search Bar (Pill Widget)

Consolidated 3-segment pill:

[Location Pin] Điểm nhận xe (Đà Nẵng, Hà Nội, TP.HCM, Giao tận sân bay).

[Calendar Icon] Thời gian nhận $\rightarrow$ Thời gian trả.

[Car Icon] Loại xe mong muốn.

Circular CTA button with search icon and spring bounce.

3. Payment & Hold Modal

Top: Dynamic countdown clock with animated warning progress bar (10 min = 600s).

Center: High-contrast VietQR code with pulsing scan target corners.

Bottom: Step-by-step indicators (Đang giữ xe $\rightarrow$ Chờ chuyển khoản $\rightarrow$ Tự động chuyển đơn thành công).

7. Do's & Don'ts for AI Agent

DO use framer-motion for all layout transitions, hover states, and modal appearances.

DO keep micro-interactions snappy (< 350ms) so the web app feels blisteringly fast, not sluggish.

DO use colored glow shadows (shadow-cyan-glow, shadow-amber-glow) instead of plain dark grey shadows for highlighted cards.

DON'T use generic travel/airline ticket widgets (remove all airline/train ticket icons).

DON'T crowd the screen with loud animations simultaneously; animate only the hero card, active buttons, and countdown timers.

DO ensure all touch targets on mobile are at least 44px by 44px with comfortable tap padding.