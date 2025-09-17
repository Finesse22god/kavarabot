// User types
export interface User {
  id: string;
  createdAt: Date;
  telegramId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  loyaltyPoints?: number;
  referralCode?: string;
  referredBy?: string;
}

export interface CreateUserDto {
  telegramId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  loyaltyPoints?: number;
  referralCode?: string;
  referredBy?: string;
}

// Quiz Response types
export interface QuizResponse {
  id: string;
  createdAt: Date;
  userId?: string;
  size?: string;
  height?: string;
  weight?: string;
  goals?: string[];
  budget?: string;
}

export interface CreateQuizResponseDto {
  userId?: string;
  size?: string;
  height?: string;
  weight?: string;
  goals?: string[];
  budget?: string;
}

// Product types
export interface Product {
  id: string;
  createdAt: Date;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  brand?: string;
  color?: string;
  sizes?: string[];
  isAvailable: boolean;
  sportTypes?: string[];
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  brand?: string;
  color?: string;
  sizes?: string[];
  isAvailable?: boolean;
  sportTypes?: string[];
}

// BoxProduct types
export interface BoxProduct {
  id: string;
  createdAt: Date;
  boxId: string;
  productId: string;
  quantity: number;
  product?: Product;
}

// Box types
export interface Box {
  id: string;
  createdAt: Date;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  contents?: string[];
  category?: string;
  emoji?: string;
  isAvailable: boolean;
  sportTypes?: string[];
  boxProducts?: BoxProduct[];
}

export interface CreateBoxDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  contents?: string[];
  category?: string;
  emoji?: string;
  isAvailable?: boolean;
  sportTypes?: string[];
  productIds?: string[];
  productQuantities?: number[];
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  createdAt: Date;
  userId?: string;
  boxId?: string;
  productId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: string;
  paymentMethod: string;
  totalPrice: number;
  selectedSize?: string;
  cartItems?: string;
  status: string;
  boxName?: string; // Название заказанного товара
  userInfo?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    telegramId?: string;
  };
}

export interface CreateOrderDto {
  userId?: string;
  boxId?: string;
  productId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: string;
  paymentMethod: string;
  totalPrice: number;
  selectedSize?: string;
  cartItems?: string;
  promoCodeId?: string;
  trainerId?: string;
  discountPercent?: number;
  discountAmount?: number;
  loyaltyPointsUsed?: number;
}

// Notification types
export interface Notification {
  id: string;
  createdAt: Date;
  userId: string;
  boxId: string;
}

export interface CreateNotificationDto {
  userId: string;
  boxId: string;
}

// Loyalty and Referral types
export interface LoyaltyTransaction {
  id: string;
  createdAt: Date;
  userId: string;
  orderId?: string;
  type: 'earn' | 'spend' | 'referral_bonus' | 'referral_reward';
  points: number;
  description: string;
  user?: User;
  order?: Order;
}

export interface CreateLoyaltyTransactionDto {
  userId: string;
  orderId?: string;
  type: 'earn' | 'spend' | 'referral_bonus' | 'referral_reward';
  points: number;
  description: string;
}

export interface Referral {
  id: string;
  createdAt: Date;
  referrerId: string;
  referredId: string;
  status: 'pending' | 'completed';
  bonusAwarded: boolean;
  referrer?: User;
  referred?: User;
}

export interface CreateReferralDto {
  referrerId: string;
  referredId: string;
  status?: 'pending' | 'completed';
  bonusAwarded?: boolean;
}

export interface LoyaltyStats {
  totalPoints: number;
  totalEarned: number;
  totalSpent: number;
  totalReferrals: number;
  level: string;
  nextLevelPoints: number;
}

export interface CreateTrainerDto {
  email: string;
  name: string;
  phone?: string;
  gym?: string;
  promoCode: string;
  discountPercent?: number;
  commissionPercent?: number;
}

export interface CreatePromoCodeDto {
  code: string;
  type: 'trainer' | 'general' | 'loyalty_discount';
  discountPercent: number;
  discountAmount?: number;
  maxUses?: number;
  expiresAt?: Date;
  trainerId?: string;
}

export interface PromoCodeValidationResult {
  isValid: boolean;
  promoCode?: any;
  trainer?: any;
  discountPercent?: number;
  discountAmount?: number;
  error?: string;
}

// Favorites types
export interface Favorite {
  id: string;
  createdAt: Date;
  userId: string;
  boxId: string;
  user?: User;
  box?: Box;
}

export interface CreateFavoriteDto {
  userId: string;
  boxId: string;
}