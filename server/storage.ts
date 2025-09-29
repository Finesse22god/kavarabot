import { Repository } from "typeorm";
import { AppDataSource } from "./database";
import { User } from "./entities/User";
import { QuizResponse } from "./entities/QuizResponse";
import { Box } from "./entities/Box";
import { Order } from "./entities/Order";
import { Notification } from "./entities/Notification";
import { LoyaltyTransaction } from "./entities/LoyaltyTransaction";
import { Referral } from "./entities/Referral";
import { Trainer } from "./entities/Trainer";
import { PromoCode } from "./entities/PromoCode";
import { Favorite } from "./entities/Favorite";
import { Cart } from "./entities/Cart";
import { Product } from "./entities/Product";
import { BoxProduct } from "./entities/BoxProduct";
import type { 
  CreateUserDto, 
  CreateQuizResponseDto, 
  CreateBoxDto, 
  CreateOrderDto, 
  CreateNotificationDto,
  CreateLoyaltyTransactionDto,
  CreateReferralDto,
  CreateTrainerDto,
  CreatePromoCodeDto,
  CreateFavoriteDto,
  CreateProductDto,
  LoyaltyStats,
  PromoCodeValidationResult
} from "@shared/types";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | null>;
  getUserByTelegramId(telegramId: string): Promise<User | null>;
  createUser(user: CreateUserDto): Promise<User>;
  updateUser(id: string, data: Partial<CreateUserDto>): Promise<User | null>;
  updateUserMeasurements(telegramId: string, measurements: {
    height?: string;
    weight?: string;
    sleeveLength?: string;
    chestSize?: string;
    waistSize?: string;
    hipSize?: string;
    preferredSize?: string;
  }): Promise<User | null>;
  getAllUsers(): Promise<User[]>;

  // Quiz Responses
  getQuizResponse(userId: string): Promise<QuizResponse | null>;
  getQuizResponseByTelegramId(telegramId: string): Promise<QuizResponse | null>;
  createQuizResponse(response: CreateQuizResponseDto): Promise<QuizResponse>;
  updateQuizResponse(userId: string, response: Partial<CreateQuizResponseDto>): Promise<QuizResponse | null>;

  // Boxes
  getAllBoxes(): Promise<Box[]>;
  getBox(id: string): Promise<Box | null>;
  getBoxesByCategory(category: string): Promise<Box[]>;
  createBox(box: CreateBoxDto): Promise<Box>;
  updateBox(id: string, data: Partial<CreateBoxDto>): Promise<Box | null>;
  updateBoxPrice(id: string, price: number): Promise<Box | null>;
  deleteBox(id: string): Promise<void>;

  // Orders
  getOrder(id: string): Promise<Order | null>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: CreateOrderDto): Promise<Order>;

  // Notifications
  createNotification(notification: CreateNotificationDto): Promise<Notification>;
  getNotificationsByBox(boxId: string): Promise<Notification[]>;

  // Loyalty System
  createLoyaltyTransaction(transaction: CreateLoyaltyTransactionDto): Promise<LoyaltyTransaction>;
  getLoyaltyTransactionsByUser(userId: string): Promise<LoyaltyTransaction[]>;
  updateUserLoyaltyPoints(userId: string, points: number): Promise<User | null>;
  getUserLoyaltyStats(userId: string): Promise<LoyaltyStats>;

  // Referral System
  createReferral(referral: CreateReferralDto): Promise<Referral>;
  getReferralsByUser(userId: string): Promise<Referral[]>;
  getUserByReferralCode(code: string): Promise<User | null>;
  generateReferralCode(userId: string): Promise<string>;
  completeReferral(referralId: string): Promise<Referral | null>;

  // Trainer System
  createTrainer(trainer: CreateTrainerDto): Promise<Trainer>;
  getTrainer(id: string): Promise<Trainer | null>;
  getTrainerByEmail(email: string): Promise<Trainer | null>;
  getTrainerByPromoCode(promoCode: string): Promise<Trainer | null>;
  getAllTrainers(): Promise<Trainer[]>;
  updateTrainerStats(trainerId: string, orderValue: number): Promise<Trainer | null>;

  // Promo Code System
  createPromoCode(promoCode: CreatePromoCodeDto): Promise<PromoCode>;
  validatePromoCode(code: string): Promise<PromoCodeValidationResult>;
  applyPromoCode(code: string): Promise<PromoCode | null>;
  getPromoCodeUsage(code: string): Promise<number>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  getPromoCodeByCode(code: string): Promise<PromoCode | null>;
  updatePromoCodeStatus(id: string, isActive: boolean): Promise<PromoCode | null>;
  getOrdersByPromoCodeId(promoCodeId: string): Promise<Order[]>;

  // Favorites System
  createFavorite(favorite: CreateFavoriteDto): Promise<any>;
  removeFavorite(userId: string, boxId: string): Promise<boolean>;
  getUserFavorites(userId: string): Promise<any[]>;
  isFavorite(userId: string, boxId: string): Promise<boolean>;

  // Cart System
  addToCart(userId: string, itemId: string, quantity?: number, selectedSize?: string, itemType?: string): Promise<Cart>;
  removeFromCart(itemId: string): Promise<boolean>;
  updateCartItemQuantity(itemId: string, quantity: number): Promise<Cart | null>;
  getUserCart(userId: string): Promise<Cart[]>;
  clearUserCart(userId: string): Promise<boolean>;

  // Products System
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: CreateProductDto): Promise<Product>;
  updateProduct(id: string, data: Partial<CreateProductDto>): Promise<Product | null>;
  deleteProduct(id: string): Promise<void>;

  // BoxProduct System
  addProductToBox(boxId: string, productId: string, quantity: number): Promise<BoxProduct>;
  removeProductFromBox(boxId: string, productId: string): Promise<boolean>;
  getBoxProducts(boxId: string): Promise<BoxProduct[]>;
  updateBoxProductQuantity(boxId: string, productId: string, quantity: number): Promise<BoxProduct | null>;
}

export class DatabaseStorage implements IStorage {
  private userRepository: Repository<User>;
  private quizResponseRepository: Repository<QuizResponse>;
  private boxRepository: Repository<Box>;
  private orderRepository: Repository<Order>;
  private notificationRepository: Repository<Notification>;
  private loyaltyTransactionRepository: Repository<LoyaltyTransaction>;
  private referralRepository: Repository<Referral>;
  private trainerRepository: Repository<Trainer>;
  private promoCodeRepository: Repository<PromoCode>;
  private favoriteRepository: Repository<Favorite>;
  private cartRepository: Repository<Cart>;
  private productRepository: Repository<Product>;
  private boxProductRepository: Repository<BoxProduct>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.quizResponseRepository = AppDataSource.getRepository(QuizResponse);
    this.boxRepository = AppDataSource.getRepository(Box);
    this.orderRepository = AppDataSource.getRepository(Order);
    this.notificationRepository = AppDataSource.getRepository(Notification);
    this.loyaltyTransactionRepository = AppDataSource.getRepository(LoyaltyTransaction);
    this.referralRepository = AppDataSource.getRepository(Referral);
    this.trainerRepository = AppDataSource.getRepository(Trainer);
    this.promoCodeRepository = AppDataSource.getRepository(PromoCode);
    this.favoriteRepository = AppDataSource.getRepository(Favorite);
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.productRepository = AppDataSource.getRepository(Product);
    this.boxProductRepository = AppDataSource.getRepository(BoxProduct);
  }

  async getUser(id: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ telegramId });
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      telegramId: userData.telegramId,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
    });
    return await this.userRepository.save(user);
  }

  async updateUser(id: string, data: Partial<CreateUserDto>): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;

    Object.assign(user, {
      firstName: data.firstName ?? user.firstName,
      lastName: data.lastName ?? user.lastName,
      username: data.username ?? user.username,
    });

    return await this.userRepository.save(user);
  }

  async updateUserMeasurements(telegramId: string, measurements: {
    height?: string;
    weight?: string;
    sleeveLength?: string;
    chestSize?: string;
    waistSize?: string;
    hipSize?: string;
    preferredSize?: string;
  }): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ telegramId });
    if (!user) return null;

    Object.assign(user, {
      height: measurements.height ?? user.height,
      weight: measurements.weight ?? user.weight,
      sleeveLength: measurements.sleeveLength ?? user.sleeveLength,
      chestSize: measurements.chestSize ?? user.chestSize,
      waistSize: measurements.waistSize ?? user.waistSize,
      hipSize: measurements.hipSize ?? user.hipSize,
      preferredSize: measurements.preferredSize ?? user.preferredSize,
    });

    return await this.userRepository.save(user);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({
      order: { createdAt: "DESC" }
    });
  }

  async getQuizResponse(userId: string): Promise<QuizResponse | null> {
    return await this.quizResponseRepository.findOneBy({ userId });
  }

  async getQuizResponseByTelegramId(telegramId: string): Promise<QuizResponse | null> {
    const user = await this.getUserByTelegramId(telegramId);
    if (!user) return null;
    return await this.quizResponseRepository.findOneBy({ userId: user.id });
  }

  async createQuizResponse(responseData: CreateQuizResponseDto): Promise<QuizResponse> {
    // If userId looks like telegramId (numeric string), find the actual user
    let actualUserId = responseData.userId;
    if (responseData.userId && /^\d+$/.test(responseData.userId)) {
      const user = await this.getUserByTelegramId(responseData.userId);
      if (user) {
        actualUserId = user.id;
      }
    }

    const response = this.quizResponseRepository.create({
      userId: actualUserId,
      size: responseData.size,
      height: responseData.height,
      weight: responseData.weight,
      goals: responseData.goals,
      budget: responseData.budget,
    });
    return await this.quizResponseRepository.save(response);
  }

  async updateQuizResponse(userId: string, updateData: Partial<CreateQuizResponseDto>): Promise<QuizResponse | null> {
    // If userId looks like telegramId (numeric string), find the actual user
    let actualUserId = userId;
    if (userId && /^\d+$/.test(userId)) {
      const user = await this.getUserByTelegramId(userId);
      if (user) {
        actualUserId = user.id;
      }
    }

    const existing = await this.getQuizResponse(actualUserId);
    if (!existing) return null;

    Object.assign(existing, {
      size: updateData.size ?? existing.size,
      height: updateData.height ?? existing.height,
      weight: updateData.weight ?? existing.weight,
      goals: updateData.goals ?? existing.goals,
      budget: updateData.budget ?? existing.budget,
    });

    return await this.quizResponseRepository.save(existing);
  }

  async getAllBoxes(): Promise<Box[]> {
    return await this.boxRepository.find({
      order: { createdAt: "DESC" }
    });
  }

  async getBox(id: string): Promise<Box | null> {
    return await this.boxRepository.findOneBy({ id });
  }

  async getBoxesByCategory(category: string): Promise<Box[]> {
    return await this.boxRepository.find({
      where: { category },
      order: { createdAt: "DESC" }
    });
  }

  async createBox(boxData: CreateBoxDto): Promise<Box> {
    console.log("💾 Storage.createBox - получены данные:", JSON.stringify(boxData, null, 2));
    
    try {
      const box = this.boxRepository.create({
        name: boxData.name,
        description: boxData.description,
        price: boxData.price,
        imageUrl: boxData.imageUrl,
        contents: boxData.contents,
        category: boxData.category,
        emoji: boxData.emoji,
        isAvailable: boxData.isAvailable ?? true,
        sportTypes: boxData.sportTypes || [],
      });
      
      console.log("💾 Объект бокса создан:", JSON.stringify(box, null, 2));
      
      const savedBox = await this.boxRepository.save(box);
      console.log("💾 Бокс сохранен в БД:", savedBox.id);
      
      return savedBox;
    } catch (error) {
      console.error("💾 Ошибка в Storage.createBox:", error);
      throw error;
    }
  }

  async updateBox(id: string, data: Partial<CreateBoxDto>): Promise<Box | null> {
    const box = await this.boxRepository.findOneBy({ id });
    if (!box) return null;
    
    // Обновляем только предоставленные поля
    if (data.name !== undefined) box.name = data.name;
    if (data.description !== undefined) box.description = data.description;
    if (data.price !== undefined) box.price = data.price;
    if (data.category !== undefined) box.category = data.category;
    if (data.imageUrl !== undefined) box.imageUrl = data.imageUrl;
    if (data.contents !== undefined) box.contents = data.contents;
    if (data.emoji !== undefined) box.emoji = data.emoji;
    if (data.isAvailable !== undefined) box.isAvailable = data.isAvailable;
    if (data.sportTypes !== undefined) box.sportTypes = data.sportTypes;
    
    return await this.boxRepository.save(box);
  }

  async updateBoxPrice(id: string, price: number): Promise<Box | null> {
    const box = await this.boxRepository.findOne({ where: { id } });
    if (!box) return null;

    box.price = price;
    return await this.boxRepository.save(box);
  }

  async deleteBox(id: string): Promise<void> {
    await this.boxRepository.delete(id);
  }

  async getOrder(id: string): Promise<Order | null> {
    return await this.orderRepository.findOneBy({ id });
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    // Check if userId is a telegramId (numeric string) or UUID
    if (/^\d+$/.test(userId)) {
      // It's a telegramId, find user first
      const user = await this.userRepository.findOneBy({ telegramId: userId });
      if (!user) {
        return [];
      }
      return await this.orderRepository.find({ 
        where: { userId: user.id },
        relations: ["box"],
        order: { createdAt: "DESC" }
      });
    } else {
      // It's a UUID
      return await this.orderRepository.find({ 
        where: { userId },
        relations: ["box"],
        order: { createdAt: "DESC" }
      });
    }
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: ["box", "user"],
      order: { createdAt: "DESC" }
    });
  }

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    // If userId looks like telegramId (numeric string), find the actual user
    let actualUserId = orderData.userId;
    if (orderData.userId && /^\d+$/.test(orderData.userId)) {
      const user = await this.getUserByTelegramId(orderData.userId);
      if (user) {
        actualUserId = user.id;
      }
    }

    const orderNumber = `KB${Date.now().toString().slice(-6)}`;
    const order = this.orderRepository.create({
      orderNumber,
      userId: actualUserId,
      boxId: orderData.boxId || null,
      productId: orderData.productId || null,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      deliveryMethod: orderData.deliveryMethod,
      paymentMethod: orderData.paymentMethod,
      totalPrice: orderData.totalPrice,
      selectedSize: orderData.selectedSize || null,
      cartItems: orderData.cartItems || null,
      status: "pending",
    });
    
    return await this.orderRepository.save(order);
  }

  async createNotification(notificationData: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: notificationData.userId,
      boxId: notificationData.boxId,
    });
    return await this.notificationRepository.save(notification);
  }

  async getNotificationsByBox(boxId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { boxId },
      order: { createdAt: "DESC" }
    });
  }

  async updateOrderStatus(orderNumber: string, status: string): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber }
    });

    if (order) {
      order.status = status;
      return await this.orderRepository.save(order);
    }
    return null;
  }

  async updateOrderStatusByPaymentId(paymentId: string, status: string): Promise<Order | null> {
    // Find order by matching payment ID stored in the order
    const order = await this.orderRepository.findOne({
      where: { paymentId }
    });

    if (order) {
      console.log(`Found order ${order.orderNumber} for payment ID: ${paymentId}`);
      order.status = status;
      return await this.orderRepository.save(order);
    } else {
      console.log(`No order found for payment ID: ${paymentId}`);
      return null;
    }
  }

  async updateOrderPaymentId(orderId: string, paymentId: string): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    if (order) {
      order.paymentId = paymentId;
      return await this.orderRepository.save(order);
    }
    return null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ["box", "user"]
    });

    if (!order) return null;

    // Calculate totalPrice if missing or zero
    if (!order.totalPrice || order.totalPrice <= 0) {
      let calculatedPrice = 0;

      // If order has a box, use box price
      if (order.boxId && order.box) {
        calculatedPrice = order.box.price;
      }
      // If order has a product, fetch and use product price
      else if (order.productId) {
        const product = await this.productRepository.findOne({ where: { id: order.productId } });
        if (product) {
          calculatedPrice = product.price;
        }
      }
      // If order has cart items, calculate from cart
      else if (order.cartItems) {
        try {
          const items = JSON.parse(order.cartItems);
          calculatedPrice = items.reduce((total: number, item: any) => {
            return total + ((item.price || 0) * (item.quantity || 1));
          }, 0);
        } catch (error) {
          console.error('Error parsing cart items:', error);
        }
      }

      // Update the order with calculated price if we found one
      if (calculatedPrice > 0) {
        order.totalPrice = calculatedPrice;
        await this.orderRepository.save(order);
      }
    }

    return order;
  }

  // Loyalty System Methods
  async createLoyaltyTransaction(transactionData: CreateLoyaltyTransactionDto): Promise<LoyaltyTransaction> {
    const transaction = this.loyaltyTransactionRepository.create({
      userId: transactionData.userId,
      orderId: transactionData.orderId,
      type: transactionData.type,
      points: transactionData.points,
      description: transactionData.description,
    });
    return await this.loyaltyTransactionRepository.save(transaction);
  }

  async getLoyaltyTransactionsByUser(userId: string): Promise<LoyaltyTransaction[]> {
    return await this.loyaltyTransactionRepository.find({
      where: { userId },
      relations: ["order"],
      order: { createdAt: "DESC" }
    });
  }

  async updateUserLoyaltyPoints(userId: string, points: number): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return null;

    user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
    return await this.userRepository.save(user);
  }

  async getUserLoyaltyStats(userId: string): Promise<LoyaltyStats> {
    const transactions = await this.getLoyaltyTransactionsByUser(userId);
    const referrals = await this.getReferralsByUser(userId);
    const user = await this.userRepository.findOneBy({ id: userId });

    const totalEarned = transactions
      .filter(t => t.type === 'earn' || t.type === 'referral_bonus' || t.type === 'referral_reward')
      .reduce((sum, t) => sum + t.points, 0);
    
    const totalSpent = transactions
      .filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + t.points, 0);

    const totalPoints = user?.loyaltyPoints || 0;
    const totalReferrals = referrals.filter(r => r.status === 'completed').length;

    // Define loyalty levels
    const getLoyaltyLevel = (points: number) => {
      if (points >= 10000) return { level: 'Platinum', nextLevelPoints: 0 };
      if (points >= 5000) return { level: 'Gold', nextLevelPoints: 10000 - points };
      if (points >= 2000) return { level: 'Silver', nextLevelPoints: 5000 - points };
      if (points >= 500) return { level: 'Bronze', nextLevelPoints: 2000 - points };
      return { level: 'Новичок', nextLevelPoints: 500 - points };
    };

    const { level, nextLevelPoints } = getLoyaltyLevel(totalPoints);

    return {
      totalPoints,
      totalEarned,
      totalSpent,
      totalReferrals,
      level,
      nextLevelPoints
    };
  }

  // Referral System Methods
  async createReferral(referralData: CreateReferralDto): Promise<Referral> {
    const referral = this.referralRepository.create({
      referrerId: referralData.referrerId,
      referredId: referralData.referredId,
      status: referralData.status || 'pending',
      bonusAwarded: referralData.bonusAwarded || false,
    });
    return await this.referralRepository.save(referral);
  }

  async getReferralsByUser(userId: string): Promise<Referral[]> {
    return await this.referralRepository.find({
      where: { referrerId: userId },
      relations: ["referred"],
      order: { createdAt: "DESC" }
    });
  }

  async getUserByReferralCode(code: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ referralCode: code });
  }

  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new Error('User not found');

    // Generate unique referral code
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      // Create a code from username or random string
      const baseCode = user.username || 'USER';
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      referralCode = `${baseCode}${randomSuffix}`.toUpperCase();
      
      const existingUser = await this.getUserByReferralCode(referralCode);
      if (!existingUser) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      // Fallback to timestamp-based code
      referralCode = `KAVARA${Date.now().toString().slice(-6)}`;
    }

    user.referralCode = referralCode!;
    await this.userRepository.save(user);
    
    return referralCode!;
  }

  async completeReferral(referralId: string): Promise<Referral | null> {
    const referral = await this.referralRepository.findOneBy({ id: referralId });
    if (!referral) return null;

    referral.status = 'completed';
    referral.bonusAwarded = true;
    
    return await this.referralRepository.save(referral);
  }

  // Trainer System Methods
  async createTrainer(trainerData: CreateTrainerDto): Promise<Trainer> {
    const trainer = this.trainerRepository.create({
      email: trainerData.email,
      name: trainerData.name,
      phone: trainerData.phone,
      gym: trainerData.gym,
      promoCode: trainerData.promoCode,
      discountPercent: trainerData.discountPercent || 15,
      commissionPercent: trainerData.commissionPercent || 10,
    });
    return await this.trainerRepository.save(trainer);
  }

  async getTrainer(id: string): Promise<Trainer | null> {
    return await this.trainerRepository.findOneBy({ id });
  }

  async getTrainerByEmail(email: string): Promise<Trainer | null> {
    return await this.trainerRepository.findOneBy({ email });
  }

  async getTrainerByPromoCode(promoCode: string): Promise<Trainer | null> {
    return await this.trainerRepository.findOneBy({ promoCode });
  }

  async getAllTrainers(): Promise<Trainer[]> {
    return await this.trainerRepository.find({
      order: { createdAt: "DESC" }
    });
  }

  async updateTrainerStats(trainerId: string, orderValue: number): Promise<Trainer | null> {
    const trainer = await this.trainerRepository.findOneBy({ id: trainerId });
    if (!trainer) return null;

    trainer.totalOrders += 1;
    trainer.totalEarnings += (orderValue * trainer.commissionPercent) / 100;

    return await this.trainerRepository.save(trainer);
  }

  // Promo Code System Methods
  async createPromoCode(promoCodeData: CreatePromoCodeDto): Promise<PromoCode> {
    const promoCode = this.promoCodeRepository.create({
      ...promoCodeData,
      type: 'general' as any // Temporary fix for type compatibility
    });
    return await this.promoCodeRepository.save(promoCode);
  }

  async validatePromoCode(code: string): Promise<PromoCodeValidationResult> {
    const promoCode = await this.promoCodeRepository.findOne({
      where: { code: code.toUpperCase() },
      relations: ['trainer']
    });

    if (!promoCode) {
      return { isValid: false, error: "Промокод не найден" };
    }

    if (!promoCode.isActive) {
      return { isValid: false, error: "Промокод неактивен" };
    }

    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      return { isValid: false, error: "Промокод истек" };
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return { isValid: false, error: "Промокод уже использован максимальное количество раз" };
    }

    return {
      isValid: true,
      promoCode,
      trainer: promoCode.trainer,
      discountPercent: promoCode.discountPercent,
      discountAmount: promoCode.discountAmount
    };
  }

  async applyPromoCode(code: string): Promise<PromoCode | null> {
    const promoCode = await this.promoCodeRepository.findOneBy({ 
      code: code.toUpperCase() 
    });
    
    if (!promoCode) return null;

    promoCode.usedCount += 1;
    return await this.promoCodeRepository.save(promoCode);
  }

  async getPromoCodeUsage(code: string): Promise<number> {
    const promoCode = await this.promoCodeRepository.findOneBy({ 
      code: code.toUpperCase() 
    });
    return promoCode?.usedCount || 0;
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await this.promoCodeRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | null> {
    return await this.promoCodeRepository.findOneBy({ 
      code: code.toUpperCase() 
    });
  }

  async updatePromoCodeStatus(id: string, isActive: boolean): Promise<PromoCode | null> {
    const promoCode = await this.promoCodeRepository.findOneBy({ id });
    if (!promoCode) return null;
    
    promoCode.isActive = isActive;
    return await this.promoCodeRepository.save(promoCode);
  }

  async getOrdersByPromoCodeId(promoCodeId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { promoCodeId },
      order: { createdAt: 'DESC' }
    });
  }

  // Update trainer discount
  async updateTrainerDiscount(trainerId: string, discountPercent: number): Promise<Trainer | null> {
    const trainer = await this.trainerRepository.findOne({ where: { id: trainerId } });
    if (!trainer) return null;
    
    trainer.discountPercent = discountPercent;
    await this.trainerRepository.save(trainer);
    
    // Update associated promo code discount
    const promoCode = await this.promoCodeRepository.findOne({ where: { trainerId } });
    if (promoCode) {
      promoCode.discountPercent = discountPercent;
      await this.promoCodeRepository.save(promoCode);
    }
    
    return trainer;
  }

  // Admin methods for user management
  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' }
    });
  }

  async getLoyaltyStatsByUserId(userId: string): Promise<any> {
    const transactions = await this.loyaltyTransactionRepository.find({
      where: { userId }
    });
    
    const referrals = await this.referralRepository.find({
      where: { referrerId: userId }
    });

    const totalPoints = transactions
      .filter(t => t.type === 'earn' || t.type === 'referral_bonus')
      .reduce((sum, t) => sum + t.points, 0) -
      transactions
      .filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + Math.abs(t.points), 0);

    const totalEarned = transactions
      .filter(t => t.type === 'earn' || t.type === 'referral_bonus')
      .reduce((sum, t) => sum + t.points, 0);

    return {
      totalPoints,
      totalEarned,
      totalReferrals: referrals.length
    };
  }

  // Favorites System Methods
  async createFavorite(favoriteData: CreateFavoriteDto): Promise<Favorite> {
    // Check if favorite already exists
    const existing = await this.favoriteRepository.findOne({
      where: { userId: favoriteData.userId, boxId: favoriteData.boxId }
    });
    
    if (existing) {
      return existing;
    }

    const favorite = this.favoriteRepository.create({
      userId: favoriteData.userId,
      boxId: favoriteData.boxId,
    });
    return await this.favoriteRepository.save(favorite);
  }

  async removeFavorite(userId: string, boxId: string): Promise<boolean> {
    const result = await this.favoriteRepository.delete({
      userId,
      boxId
    });
    return (result.affected ?? 0) > 0;
  }

  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return await this.favoriteRepository.find({
      where: { userId },
      relations: ["box"],
      order: { createdAt: "DESC" }
    });
  }

  async isFavorite(userId: string, boxId: string): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, boxId }
    });
    return !!favorite;
  }

  // Cart System Methods
  async addToCart(userId: string, itemId: string, quantity: number = 1, selectedSize?: string, itemType?: string): Promise<Cart> {
    // Determine item type based on what we're adding
    const isProduct = itemType === "product" || await this.getProduct(itemId);
    const type = isProduct ? "product" : "box";
    
    // Check if item already exists in cart with same size and type
    const whereCondition = type === "product" 
      ? { userId, productId: itemId, selectedSize, itemType: type }
      : { userId, boxId: itemId, selectedSize, itemType: type };
      
    const existingItem = await this.cartRepository.findOne({
      where: whereCondition
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      return await this.cartRepository.save(existingItem);
    }

    const cartData = {
      userId,
      quantity,
      selectedSize,
      itemType: type,
      ...(type === "product" ? { productId: itemId } : { boxId: itemId })
    };

    const cartItem = this.cartRepository.create(cartData);
    return await this.cartRepository.save(cartItem);
  }

  async removeFromCart(itemId: string): Promise<boolean> {
    const result = await this.cartRepository.delete(itemId);
    return result.affected! > 0;
  }

  async updateCartItemQuantity(itemId: string, quantity: number): Promise<Cart | null> {
    await this.cartRepository.update(itemId, { quantity });
    return await this.cartRepository.findOneBy({ id: itemId });
  }

  async getUserCart(userId: string): Promise<Cart[]> {
    return await this.cartRepository.find({
      where: { userId },
      relations: ["box", "product"],
      order: { createdAt: "DESC" }
    });
  }

  async clearUserCart(userId: string): Promise<boolean> {
    const result = await this.cartRepository.delete({ userId });
    return result.affected! > 0;
  }

  // Products System
  async getAllProducts(): Promise<Product[]> {
    return await this.productRepository.find({
      order: { createdAt: "DESC" }
    });
  }

  async getProduct(id: string): Promise<Product | null> {
    return await this.productRepository.findOneBy({ id });
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { category },
      order: { createdAt: "DESC" }
    });
  }

  async createProduct(productData: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(productData);
    return await this.productRepository.save(product);
  }

  async updateProduct(id: string, data: Partial<CreateProductDto>): Promise<Product | null> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) return null;

    Object.assign(product, data);
    return await this.productRepository.save(product);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }

  // BoxProduct System
  async addProductToBox(boxId: string, productId: string, quantity: number): Promise<BoxProduct> {
    // Check if already exists
    const existing = await this.boxProductRepository.findOne({
      where: { boxId, productId }
    });

    if (existing) {
      existing.quantity += quantity;
      return await this.boxProductRepository.save(existing);
    }

    const boxProduct = this.boxProductRepository.create({
      boxId,
      productId,
      quantity
    });
    return await this.boxProductRepository.save(boxProduct);
  }

  async removeProductFromBox(boxId: string, productId: string): Promise<boolean> {
    const result = await this.boxProductRepository.delete({ boxId, productId });
    return result.affected! > 0;
  }

  async getBoxProducts(boxId: string): Promise<BoxProduct[]> {
    return await this.boxProductRepository.find({
      where: { boxId },
      relations: ["product"],
      order: { createdAt: "DESC" }
    });
  }

  async updateBoxProductQuantity(boxId: string, productId: string, quantity: number): Promise<BoxProduct | null> {
    const boxProduct = await this.boxProductRepository.findOne({
      where: { boxId, productId }
    });
    
    if (!boxProduct) return null;

    boxProduct.quantity = quantity;
    return await this.boxProductRepository.save(boxProduct);
  }
}

export const storage = new DatabaseStorage();