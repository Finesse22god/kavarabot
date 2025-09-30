# KAVARA - Telegram Sports Fashion Bot

## Overview

KAVARA is a Telegram-based sports fashion styling service offering personalized athletic wear recommendations through a web interface. Users can take a quiz for custom box recommendations or browse pre-curated boxes. The system manages the entire purchase flow, from selection to order completion, and includes integrated notification systems. The project aims to provide a streamlined, personalized shopping experience for sports fashion.

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