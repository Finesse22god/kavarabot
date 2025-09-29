# KAVARA - Telegram Sports Fashion Bot

## Overview

KAVARA is a Telegram-based sports fashion styling service that provides personalized athletic wear recommendations. The application consists of a web interface built for Telegram WebApp integration, where users can either take a personalized quiz to receive custom box recommendations or browse pre-curated ready-made boxes. The system handles the complete purchase flow from selection to order completion with integrated notification systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **UI Components**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with TypeORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with JSON responses
- **Development**: Hot module replacement with Vite middleware integration
- **Storage Layer**: TypeORM repositories with entity-based data access

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database
- **ORM**: TypeORM with decorators and entity classes
- **Schema Management**: TypeORM automatic synchronization for development
- **Session Storage**: Browser sessionStorage for temporary data persistence
- **Development Storage**: TypeORM repositories with full PostgreSQL integration

### Authentication and Authorization
- **Primary Auth**: Telegram WebApp authentication via initDataUnsafe
- **User Identification**: Telegram user ID as primary identifier
- **Development Mode**: Mock user data for testing without Telegram integration
- **Session Management**: Stateless approach using Telegram's built-in security

### External Dependencies
- **Database**: Neon Database (PostgreSQL-compatible serverless database)
- **Telegram Platform**: Telegram WebApp API for user authentication and native integration
- **UI Framework**: Radix UI primitives for accessible component foundation
- **Payment Processing**: Planned integration (infrastructure ready via order system)
- **Image Hosting**: External image URLs (Unsplash for placeholders)
- **Development Tools**: Replit-specific plugins for development environment integration

### Key Architectural Decisions

**Database Design**: Uses TypeORM entities with decorators, UUID primary keys, and proper relationship mapping between users, quiz responses, boxes, orders, and notifications. Entity classes define schema structure and relationships.

**API Structure**: RESTful endpoints organized by resource type (users, quiz-responses, boxes, orders, notifications) with proper HTTP status codes and error handling.

**Component Architecture**: Separation of concerns with reusable UI components, custom hooks for business logic, and page-level components for routing.

**Development vs Production**: Dual-mode configuration supporting both local development with mock data and production Telegram WebApp integration.

**State Management**: Server state managed by TanStack Query for caching and synchronization, local state handled by React hooks, temporary data stored in sessionStorage for cross-page persistence.

**Error Handling**: Comprehensive error boundaries with user-friendly error messages and proper HTTP status code handling throughout the application stack.

**Payment Integration**: Complete ЮMoney payment system with webhook verification. Payment ID links orders to transactions for automatic status updates. Return URL redirects to Telegram Mini App after payment completion.

## Recent Changes (September 29, 2025)

**КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ ВСЕХ ОСНОВНЫХ ПРОБЛЕМ - Версия 2.1.0**:

### 🔥 Экстренные исправления (29.09.2025 - 10:30 UTC):
- **✅ Восстановлена работа избранного**: FavoriteButton теперь корректно работает с товарами и боксами, исправлена передача boxId
- **✅ Исправлен роутинг каталога**: Товары с размерами правильно направляются на /product/:id, боксы на /box/:id
- **✅ Восстановлена функциональность корзины**: Разделены кнопки "В КОРЗИНУ" и навигация, предотвращена регрессия
- **✅ Полностью исправлена админ панель**: Создание боксов работает с выбором товаров, валидацией и API интеграцией
- **✅ Улучшено отображение содержимого боксов**: Приоритет реальным товарам > JSON содержимое > fallback данные
- **✅ Исправлена оплата заказов**: Устранена критическая ошибка в calculateOrderTotal, которая ломала платежную систему
- **✅ Расширена информация о заказах**: Полные данные о товарах, размерах, брендах в деталях заказа

### 🛠 Технические улучшения:
- Добавлена подробная отладка роутинга для предотвращения будущих проблем
- Улучшена обработка ошибок в платежной системе
- Расширена поддержка массивов изображений для товаров
- Оптимизирована логика fallback для расчета стоимости заказов

**Предыдущие обновления (до 29.09.2025)**:
- **Исправлен роутинг каталога**: Обновлен BoxCard компонент для корректной навигации между боксами (/box/:id) и товарами (/product/:id) на основе наличия поля sizes
- **Устранены ошибки оплаты**: Добавлена серверная логика расчета totalPrice в getOrderByNumber для заказов с отсутствующей стоимостью, включая fallback для боксов, товаров и корзины
- **Улучшены детали заказов**: Добавлено полное отображение информации о товарах с размерами, брендом, цветом, категорией и изображениями в OrderItems компоненте
- **Исправлена обработка содержимого боксов**: Добавлена поддержка как JSON-строк, так и готовых массивов для корректного отображения состава боксов
- **Восстановлена функциональность корзины**: Разделены кнопки "В КОРЗИНУ" (onAddToCart) и "Подробнее" (навигация) в каталоге для предотвращения регрессии
- **Клиентская fallback логика**: Расширена calculateOrderTotal функция для поддержки одиночных товаров и боксов через данные из API

**Предыдущие обновления:**

**Улучшение каталога, админ панели и аналитики**:
- **Оптимизация фильтров каталога**: Перемещена кнопка фильтров под раздел готовых боксов, убраны избыточные фильтры по спорту и цене
- **Расширение загрузки изображений**: Админ панель теперь поддерживает до 3 изображений на товар с предпросмотром
- **Обновление категорий товаров**: Категории в админ панели приведены в соответствие с каталогом (Рашгарды, Лосины, Футболки и др.)
- **Расширенная аналитика заказов**: Добавлены карточки для оплаченных заказов, ожидающих оплаты, среднего чека с процентными показателями
- **Поддержка массива изображений**: Обновлена база данных и API для поддержки множественных изображений товаров
- **PUT API для редактирования**: Добавлен полнофункциональный эндпоинт для редактирования товаров в админке

## Previous Changes (August 19, 2025)

**Исправление критических проблем UI и UX**:
- **Полноэкранная админ панель**: Убрана ограничения ширины для истинной полноэкранности на компьютерах
- **Реорганизация промокодов**: Промокод клиента перенесен из профиля в раздел лояльности для лучшей логической группировки
- **Упрощение профиля**: Профиль теперь содержит только "Данные" и "Размеры" без перегрузки функциями
- **Исправление белого экрана**: Решена проблема с загрузкой раздела лояльности через правильную обработку состояний
- **Улучшенная адаптивность**: Все элементы интерфейса корректно отображаются на разных экранах

## Previous Updates (August 18, 2025)

**Реферальная система клиентов и улучшение админ панели**:
- **Изменена программа лояльности**: Теперь каждый клиент получает персональный промокод для друзей вместо партнерских тренеров
- **Новая реферальная программа**: 1) Отправь промокод другу 2) Друг покупает товар 3) Ты получаешь 10% баллами от суммы заказа
- **Улучшена админ панель**: Добавлен детальный профиль пользователя с просмотром всех заказов, контактов и статистики лояльности
- **Управление пользователями**: В разделе "Пользователи" добавлена кнопка "Профиль" для просмотра полной информации о клиенте
- **Профиль пользователя в админке**: Показывает историю заказов, адреса доставки, телефон, Telegram (@username), статистику баллов
- **Генерация промокодов**: Клиенты могут создать свой промокод на странице лояльности если его еще нет
- **API для админа**: Добавлены эндпоинты `/api/admin/users/:id/orders` и `/api/admin/users/:id/loyalty` для детальной информации о пользователе
- **Упрощена система**: Убрана сложная система тренеров, теперь фокус на реферальных кодах клиентов

**Previous Updates**:
- Implemented comprehensive trainer partnership system with database entities (Trainer, PromoCode)
- Created promo code validation system with trainer-specific discounts
- Added loyalty points redemption functionality for up to 50% order discount
- Integrated PromoCodeInput and LoyaltyPointsInput components into order form
- Created test trainer and promo code (TEST10) for demonstration
- Modified order processing to handle both promo code discounts and loyalty points

**Previous Updates (January 14, 2025)**:
- Created comprehensive web-based admin panel accessible at /admin
- Admin authentication with password protection (ADMIN_PASSWORD env variable)
- Dashboard with key metrics: orders, users, products, revenue
- Order management with status tracking and customer details
- User management with registration dates and contact info
- Product catalog overview with images and pricing
- Secure login system with token-based authentication
- Mobile-responsive design with KAVARA brand styling

**Previous Updates (January 13, 2025)**:
- Fixed paymentId field linking payments to orders  
- Return URL now correctly redirects to t.me/kavaraappbot/app
- Webhook processing updated to use paymentId instead of orderNumber
- Payment status verification works through database queries
- Automatic order status updates from "pending" to "paid" via webhook
- Order notifications sent to admin channel (-1002812810825)