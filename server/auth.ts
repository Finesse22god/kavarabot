import crypto from 'crypto';

// In-memory token storage (в продакшене использовать Redis или БД)
const validTokens = new Map<string, { username: string; createdAt: number }>();

// Время жизни токена - 24 часа
const TOKEN_LIFETIME = 24 * 60 * 60 * 1000;

/**
 * Генерирует криптографически стойкий токен
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Создает и сохраняет токен для пользователя
 */
export function createAdminToken(username: string): string {
  const token = generateSecureToken();
  validTokens.set(token, {
    username,
    createdAt: Date.now()
  });
  
  // Очищаем старые токены
  cleanupExpiredTokens();
  
  return token;
}

/**
 * Проверяет валидность токена
 */
export function verifyToken(token: string): boolean {
  const tokenData = validTokens.get(token);
  
  if (!tokenData) {
    return false;
  }
  
  // Проверяем не истек ли токен
  if (Date.now() - tokenData.createdAt > TOKEN_LIFETIME) {
    validTokens.delete(token);
    return false;
  }
  
  return true;
}

/**
 * Удаляет токен (для logout)
 */
export function revokeToken(token: string): void {
  validTokens.delete(token);
}

/**
 * Очищает истекшие токены
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  const entries = Array.from(validTokens.entries());
  for (const [token, data] of entries) {
    if (now - data.createdAt > TOKEN_LIFETIME) {
      validTokens.delete(token);
    }
  }
}

/**
 * Хеширует пароль (для будущего использования)
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Проверяет пароль
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
