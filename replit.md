# KAVARA - Telegram Sports Fashion Bot

## Overview
KAVARA is a Telegram-based sports fashion styling service offering personalized athletic wear recommendations through a web interface. It allows users to take a quiz for custom box recommendations or browse pre-curated boxes. The system manages the entire purchase flow from selection to order completion, including integrated notification systems. The project aims to provide a streamlined, personalized shopping experience with quiz-exclusive boxes and robust catalog management, delivering significant market potential in personalized e-commerce.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The user interface is optimized for Telegram WebApp compatibility, featuring simplified product cards in the catalog and detailed product pages with tabs for size selection and collapsible descriptions. A consistent image-first card layout is used across products and boxes, with a photo carousel for multiple product images. The navigation includes an INFO page, Home, and Profile. The Profile tab is streamlined to "Данные", "Заказы", and "Избранное", with orders displayed inline. The bottom navigation menu (INFO/ГЛАВНАЯ/ПРОФИЛЬ) is hidden on the home page for a cleaner, immersive experience, but remains visible on all other pages.

### Telegram Mini App Integration
- **BackButton**: Automatic show/hide based on navigation (hidden on home page, visible on other pages). Requires Telegram Web App API version >= 6.1.
- **Haptic Feedback**: Integrated across all interactive elements - 'light' for navigation, 'selection' for size choices, 'medium' for primary actions like "Add to Cart".
- **Full-screen Mode**: App expands to full screen automatically on load.
- **Safe Area Handling**: Uses `env(safe-area-inset-*)` CSS variables with `.pt-safe` and `.pb-safe` utility classes for proper display on devices with notches/status bars.
- **Video Autoplay**: Hero video uses `useRef` and `useEffect` for programmatic playback with fallback touch/click handlers.

### Technical Implementation
- **Frontend**: React 18 with TypeScript, Wouter for routing, Radix UI with shadcn/ui for components, Tailwind CSS for styling, TanStack Query for server state, and Vite for building.
- **Backend**: Node.js with Express.js.
- **Deployment**: Optimized multi-stage Dockerfile for Timeweb Cloud with .dockerignore to minimize image size and deployment time.
- **Database**: PostgreSQL (Neon Database) with TypeORM, utilizing JSON columns for `sizes`, `images`, and `sportTypes` within the Product entity. UUID primary keys are used across entities.
- **Authentication**: Telegram WebApp authentication (`initDataUnsafe`) using Telegram user ID for identification and a stateless session management approach.
- **File Storage**: Timeweb S3-compatible object storage for all product and box images, with secure upload validation using AWS SDK v3 and `multer`. Base64 image protection is implemented across all layers.
- **Payment**: YooKassa integration with webhook verification for automatic status updates and Telegram Mini App redirection. Payment pages open within Telegram's built-in browser using `WebApp.openLink()` with `try_instant_view`.
- **Admin Panel**: A web-based panel for comprehensive order, user, product, and inventory management, including loyalty statistics, analytics, and quiz settings.
- **Referral System**: Client-based referral program using personalized promo codes, awarding loyalty points to owners upon successful payment confirmation.
- **Inventory Management**: Comprehensive, size-specific inventory tracking system for products and boxes, with visual indicators for stock levels in the admin panel.
- **Performance**: Implemented image lazy loading, React Query caching (`staleTime: 5 minutes`, `gcTime: 10 minutes`), smart image loading for carousels, and background placeholders for smoother visual transitions.
- **Security & Reliability**: Includes cryptographically secure admin token generation, server-side content validation for file uploads, transaction support with pessimistic write locking for order creation, mandatory user validation, cryptographically secure and unique order number generation, enhanced YooKassa error handling, and environment variable configuration.
- **Notifications**: Optimized Telegram notifications for payment confirmation, including detailed order, payment, and customer information. Admin notifications include full product/box lists with sizes and quantities.
- **Routing**: All Telegram buttons and slash commands use query parameter approach (`?startapp=<page>`) instead of direct routes, eliminating 404 errors and Nginx configuration requirements. Client-side redirect logic in App.tsx handles navigation automatically.

### Core Features
- **Quiz-Exclusive Boxes**: Supports `isQuizOnly` flag for distinct inventory management.
- **Product & Box Favorites**: Unified API and UI handling for favoriting both products and boxes.
- **Product Size Handling**: Enhanced entity to store sizes as JSON, with UI for quick selection and dynamic cart buttons.
- **Catalog Enhancements**: Sorting and improved filter layout.
- **Phone Number Formatting**: Strict `+7` prefix enforcement and automatic formatting for Russian phone numbers.
- **Order Data Enhancement**: `telegramUsername` field added to orders schema.
- **Analytics**: Improved revenue calculation (paid orders only) and accurate date filters.
- **Profile Loyalty & Promo Code Display**: Enhanced user profile with loyalty stats, available points, total earned/spent, referral count, and owned promo code details with usage statistics.

## External Dependencies

- **Database**: Neon Database (PostgreSQL)
- **Telegram Platform**: Telegram WebApp API
- **UI Framework**: Radix UI
- **Payment Processing**: YooKassa (ЮKassa)
- **Object Storage**: Timeweb Cloud S3 Storage (S3-compatible API)