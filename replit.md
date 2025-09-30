# KAVARA - Telegram Sports Fashion Bot

## Overview

KAVARA is a Telegram-based sports fashion styling service offering personalized athletic wear recommendations through a web interface. Users can take a quiz for custom box recommendations or browse pre-curated boxes. The system manages the entire purchase flow, from selection to order completion, and includes integrated notification systems. The project aims to provide a streamlined, personalized shopping experience for sports fashion.

## Recent Changes

### September 30, 2025 - Admin Panel Enhancements & Photo Carousel
- **Admin Panel Improvements**:
  - Added 3XL size option to product creation/editing form
  - Implemented manual main photo selection: hover over images to see "Set as Main" button
  - Main photo marked with green badge for visibility
  - Removed automatic redirect after product save - admin stays on edit page for better workflow
- **Product Detail Page Carousel**:
  - Implemented photo carousel with embla-carousel-react for multiple product images
  - Added navigation buttons (left/right arrows) for manual slide control
  - Active slide indicators with visual feedback (white elongated dot vs dimmed dots)
  - Single image products display without carousel controls
- **UI/UX Refinements**:
  - Changed "ХАРАКТЕРИСТИКИ" section to "СОСТАВ" in product details
  - Fixed add-to-cart button spacing: changed from bottom-20 to bottom-0 for proper alignment
- **Architect Review**: All carousel indicators and admin enhancements validated and confirmed working correctly

### September 30, 2025 (Earlier) - Critical Fixes: Image Upload & Favorites Functionality
- **Image Upload Fix**: Resolved field mapping issue in admin panel product editing
  - Changed `edit-product.tsx` to use correct field name `imageUrl` instead of `image`
  - Updated Product interface to match database schema
  - Images now correctly save and display after product updates
- **Favorites Fix**: Implemented proper userId handling in boxes page
  - Added `useTelegram` hook import and dbUser query in `boxes.tsx`
  - userId now passed to `BoxCard` component enabling favorites functionality
  - FavoriteButton correctly handles undefined userId with proper error messaging
  - Consistent behavior between catalog.tsx and boxes.tsx
- **Architect Review**: Both fixes validated and confirmed working correctly

### September 30, 2025 (Earlier) - Box-Product Integration & Real Product Display
- **Backend Enhancement**: Updated `PUT /api/admin/boxes/:id` to properly handle product associations during box updates
  - Added logic to delete old box-product relationships before creating new ones
  - Implemented proper handling of `productIds` and `productQuantities` arrays
  - Added comprehensive logging for debugging product association process
- **Frontend Cleanup**: Removed hardcoded product fallbacks from `client/src/pages/box-detail.tsx`
  - Simplified `parseBoxContents` to only show real products from database via `/api/boxes/:id/products`
  - Added user-friendly empty state with Package icon when no products are associated
  - Removed "Real Product" badges as all products are now guaranteed to be real
  - Fixed quantity badge to only display when quantity > 1
- **Database Cleanup**: Removed 3 test orders from the system to maintain clean data
- **Verified Functionality**: Confirmed that boxes with associated products display correctly with product names, descriptions, prices, and images

### September 30, 2025 (Earlier) - Product Size Handling Enhancement
- **Database Schema**: Updated Product entity to use JSON columns for `sizes`, `images`, and `sportTypes` (replacing simple-array for consistency)
- **Frontend Parsing**: Added safe parsing logic for product sizes with error handling to support both string and array formats
- **UI Validation**: Unified size selection validation between UI rendering and add-to-cart logic using `hasSizes` computed from parsed data
- **UX Improvement**: Increased bottom padding to pb-32 for proper button visibility

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

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with TypeORM (Neon Database)
- **API Design**: RESTful API with JSON responses

### Data Storage
- **Primary Database**: PostgreSQL via Neon Database
- **ORM**: TypeORM with decorators and entity classes
- **Session Storage**: Browser sessionStorage for temporary data

### Authentication and Authorization
- **Primary Auth**: Telegram WebApp authentication (initDataUnsafe)
- **User Identification**: Telegram user ID
- **Session Management**: Stateless approach using Telegram's built-in security

### Key Architectural Decisions
- **Database Design**: TypeORM entities with UUID primary keys and defined relationships (users, quiz responses, boxes, orders, notifications).
- **API Structure**: RESTful endpoints organized by resource type with proper HTTP status codes.
- **Component Architecture**: Reusable UI components, custom hooks for logic, and page-level components.
- **Development vs Production**: Dual-mode configuration for local development (mock data) and production (Telegram WebApp).
- **State Management**: Server state via TanStack Query, local state via React hooks, temporary data in sessionStorage.
- **Error Handling**: Comprehensive error boundaries and HTTP status code handling.
- **Payment Integration**: ЮMoney payment system with webhook verification for automatic status updates and Telegram Mini App redirection.
- **Admin Panel**: Web-based admin panel (`/admin`) for order, user, and product management, including detailed user profiles and loyalty statistics.
- **Referral System**: Client-based referral program using personalized promo codes for loyalty points.
- **Product UI**: Simplified product cards in catalog (photo, name, price, button only). Detailed product pages use tabs for size selection and collapsible sections for descriptions/characteristics. Optimized for Telegram WebApp compatibility (September 2025).

## External Dependencies

- **Database**: Neon Database (PostgreSQL-compatible serverless database)
- **Telegram Platform**: Telegram WebApp API
- **UI Framework**: Radix UI
- **Payment Processing**: ЮMoney
- **Image Hosting**: External image URLs (e.g., Unsplash for placeholders)