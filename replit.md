# KAVARA - Telegram Sports Fashion Bot

## Overview
KAVARA is a Telegram-based sports fashion styling service that provides personalized athletic wear recommendations through a web interface. Users can take a quiz for custom box recommendations or browse pre-curated boxes. The system manages the entire purchase flow, from selection to order completion, and includes integrated notification systems. The project aims to deliver a streamlined, personalized shopping experience for sports fashion, featuring quiz-exclusive boxes and robust catalog management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **UI Components**: Radix UI with shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite
- **UI/UX Decisions**: Optimized for Telegram WebApp compatibility. Features simplified product cards in the catalog (photo, name, price, button only) and detailed product pages with tabs for size selection and collapsible sections for descriptions/characteristics. Consistent image-first card layout across products and boxes. Photo carousel with `embla-carousel-react` for multiple product images.

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with TypeORM (Neon Database)
- **API Design**: RESTful API with JSON responses

### Data Storage
- **Primary Database**: PostgreSQL via Neon Database
- **ORM**: TypeORM with decorators and entity classes. Uses JSON columns for `sizes`, `images`, and `sportTypes` within the Product entity.
- **Session Storage**: Browser sessionStorage for temporary data

### Authentication and Authorization
- **Primary Auth**: Telegram WebApp authentication (initDataUnsafe)
- **User Identification**: Telegram user ID
- **Session Management**: Stateless approach using Telegram's built-in security

### Key Architectural Decisions
- **Database Design**: TypeORM entities with UUID primary keys and defined relationships (users, quiz responses, boxes, orders, notifications). Handles both box and product favorites with nullable `boxId` and `productId` in the favorites table.
- **API Structure**: RESTful endpoints organized by resource type with proper HTTP status codes, supporting both box and product favorite operations.
- **Component Architecture**: Reusable UI components, custom hooks for logic, and page-level components.
- **Development vs Production**: Dual-mode configuration for local development (mock data, e.g., automatic mock user for testing) and production (Telegram WebApp).
- **State Management**: Server state via TanStack Query, local state via React hooks, temporary data in sessionStorage.
- **Error Handling**: Comprehensive error boundaries and HTTP status code handling.
- **Payment Integration**: YooKassa payment system with webhook verification for automatic status updates and Telegram Mini App redirection. Webhook correctly searches orders by orderNumber from metadata (not paymentId). Payment success page (`/payment/success`) displays purchased items, payment status, and manager contact information for both box and cart orders. YooKassa `return_url` configured to open Telegram Mini App (`https://t.me/kavaraappbot/app?startapp=payment_success`) when user clicks "Back to Shop" button after payment.
- **Admin Panel**: Web-based admin panel (`/admin`) for order, user, and product management, including detailed user profiles, loyalty statistics, and comprehensive analytics (revenue tracking, order distribution, key metrics, top orders). Features include quiz settings management, category filtering, search, and improved box/product association with manual main photo selection.
- **Referral System**: Client-based referral program using personalized promo codes for loyalty points.
- **Feature Specifications**:
    - **Quiz-Exclusive Boxes**: Implemented `isQuizOnly` flag for boxes, allowing distinct inventories for public catalog and personalized quiz recommendations.
    - **Product Favorites**: Full support for favoriting individual products, in addition to boxes, with unified API and UI handling.
    - **Product Size Handling**: Enhanced product entity to store sizes, images, and sport types as JSON columns. UI includes quick size selection on product cards and dynamic "Add to Cart" button labels based on size selection.
    - **Catalog Enhancements**: Sorting functionality (price, name) and improved filter layout.
    - **Phone Number Formatting** (October 2025): Strict +7 prefix enforcement for Russian phone numbers with automatic formatting (+7 (XXX) XXX-XX-XX). Prevents invalid input and ensures exactly 11 digits.
    - **Telegram Notifications** (October 2025): Optimized to send single comprehensive notification only when payment is confirmed, including all order details, payment info, customer data, and Telegram username. Notifications include discount and loyalty points information when applicable.
    - **Order Data Enhancement** (October 2025): Added `telegramUsername` field to orders schema to capture customer's Telegram handle for better customer support and communication.
    - **Analytics Improvements** (October 2025): Fixed revenue calculation to only count paid orders. Added separate tracking for unpaid orders. Date filters now properly apply to all metrics and charts.
    - **Payment Redirect Fix** (October 2025): Fixed YooKassa return URL to properly redirect users to Telegram Mini App (`https://t.me/kavaraappbot/app?startapp=payment_success`) instead of web URL after payment completion. Updated in both checkout flow and order repayment flow.
    - **Telegram In-App Payment** (October 2025): Payment pages now open inside Telegram's built-in browser using `WebApp.openLink()` with `try_instant_view` option, keeping users within the app instead of redirecting to external browser. Includes proper fallbacks for non-Telegram environments.
    - **Enhanced Order Notifications** (October 2025): Admin Telegram notifications now include detailed product/box lists with sizes and quantities. Webhook handler loads full order relations and parses cart items to provide complete order details for administrators.
    - **Manager Contact Update** (October 2025): All "Contact Manager" buttons and links now redirect to t.me/kavarabrand instead of previous team/channel links for unified customer communication.
    - **Security & Reliability Enhancements** (October 2025):
      - **Admin Authentication**: Cryptographically secure token generation with automatic 24h expiration (server/auth.ts). Uses crypto.randomBytes for 64-char hex tokens with backward compatibility.
      - **File Upload Security**: Server-side content validation using file-type library to prevent malicious file uploads disguised as images.
      - **Race Condition Prevention**: Full transaction support with pessimistic write locking for order creation, preventing concurrent overwrites of promo codes and loyalty point balances.
      - **Data Integrity**: Mandatory user validation for all orders - strict telegramId->UUID conversion with fail-fast on missing users.
      - **Order Number Uniqueness**: Cryptographically secure order number generation using timestamp + crypto.randomInt with database uniqueness verification.
      - **Payment Error Handling**: Enhanced YooKassa integration with detailed error diagnostics, typed error responses, and comprehensive logging.
      - **Catalog Parser Optimization**: Early termination on consecutive empty pages to reduce unnecessary API calls.
      - **Configuration Management**: Removed hardcoded Telegram values, now using environment variables for ADMIN_CHAT_ID and dynamic webhook URL detection.
    - **Inventory Management System** (October 2025): Comprehensive inventory tracking system for products and boxes with size-specific stock management. Added `inventory` JSON field to products and boxes tables to store stock quantities by size (e.g., {"S": 10, "M": 15, "L": 8}). New admin panel "Остатки" (Inventory) tab provides dedicated interface for managing stock levels with visual indicators for low stock (yellow badge < 10 units) and out-of-stock (red badge, 0 units) items. Product and box cards in admin panel now display real-time inventory status badges. PATCH API endpoints (`/api/admin/products/:id` and `/api/admin/boxes/:id`) enable partial inventory updates. System designed with future 1C integration in mind for automated stock synchronization and payment reconciliation.

## External Dependencies

- **Database**: Neon Database (PostgreSQL-compatible serverless database)
- **Telegram Platform**: Telegram WebApp API
- **UI Framework**: Radix UI
- **Payment Processing**: YooKassa (ЮKassa)
- **Image Hosting**: External image URLs (e.g., Unsplash for placeholders)