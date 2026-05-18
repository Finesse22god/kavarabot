import { promises as fs } from 'fs';
import path from 'path';
import { storage } from './storage.js';
import { AppDataSource } from './database.js';
import { Order as OrderEntity } from './entities/Order.js';
import { sendTelegramHtml } from './telegram-send.js';

// Только заказы, по которым уведомление НЕ было доставлено.
// KB2676488071 и KB8748138065 пришли — их сюда не добавляем.
const ORDER_NUMBERS_TO_RESEND = [
  'KB2758727179',
];

const MARKER_FILE = path.join(process.cwd(), '.notifications-resent.json');

async function alreadySent(orderNumber: string): Promise<boolean> {
  try {
    const raw = await fs.readFile(MARKER_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data?.sent) && data.sent.includes(orderNumber);
  } catch {
    return false;
  }
}

async function markSent(orderNumber: string): Promise<void> {
  let data: { sent: string[] } = { sent: [] };
  try {
    const raw = await fs.readFile(MARKER_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.sent)) data.sent = parsed.sent;
  } catch {}
  if (!data.sent.includes(orderNumber)) data.sent.push(orderNumber);
  await fs.writeFile(MARKER_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function sendOne(orderNumber: string): Promise<void> {
  if (await alreadySent(orderNumber)) {
    console.log(`[BootResend] ${orderNumber}: уже отправлен ранее, пропускаем`);
    return;
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.warn('[BootResend] TELEGRAM_BOT_TOKEN не задан — пропускаем');
    return;
  }
  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '-1002812810825';
  const ORDERS_CHANNEL_ID = process.env.ORDERS_CHANNEL_ID;

  const order = await storage.getOrderByNumber(orderNumber);
  if (!order) {
    console.warn(`[BootResend] ${orderNumber}: заказ не найден в БД`);
    return;
  }

  let telegramUsername = '';
  if (order.userId) {
    try {
      const user = await storage.getUser(order.userId);
      if (user?.username) telegramUsername = `@${user.username}`;
    } catch {}
  }

  let fullOrder: any = order;
  try {
    fullOrder = await AppDataSource.getRepository(OrderEntity).findOne({
      where: { id: order.id },
      relations: ['box', 'product'],
    }) || order;
  } catch {}

  let itemsList = '\n🛍️ <b>Товары:</b>\n';
  try {
    if (fullOrder?.cartItems) {
      try {
        const cartItems = JSON.parse(fullOrder.cartItems);
        for (const item of cartItems) {
          const itemName = item.itemType === 'product'
            ? (item.product?.name || item.name || 'Товар')
            : item.itemType === 'box'
            ? (item.box?.name || item.name || 'Бокс')
            : (item.name || 'Товар');
          itemsList += `• ${itemName}`;
          if (item.selectedSize) {
            try {
              const sizeData = typeof item.selectedSize === 'string'
                ? JSON.parse(item.selectedSize)
                : item.selectedSize;
              if (sizeData && typeof sizeData === 'object' && (sizeData.top || sizeData.bottom)) {
                itemsList += ` (Верх: ${sizeData.top || '-'}, Низ: ${sizeData.bottom || '-'})`;
              } else {
                itemsList += ` (Размер: ${item.selectedSize})`;
              }
            } catch {
              itemsList += ` (Размер: ${item.selectedSize})`;
            }
          }
          if (item.quantity && item.quantity > 1) itemsList += ` x${item.quantity}`;
          itemsList += '\n';
        }
      } catch {
        itemsList += '• Детали товаров недоступны\n';
      }
    } else if (fullOrder?.boxId && fullOrder.box) {
      itemsList += `• ${fullOrder.box.name}`;
      if (fullOrder.selectedSize) itemsList += ` (Размер: ${fullOrder.selectedSize})`;
      itemsList += '\n';
    } else if (fullOrder?.productId && fullOrder.product) {
      itemsList += `• ${fullOrder.product.name}`;
      if (fullOrder.selectedSize) itemsList += ` (Размер: ${fullOrder.selectedSize})`;
      itemsList += '\n';
    } else {
      itemsList += '• Детали товаров недоступны\n';
    }
  } catch {
    itemsList += '• Детали товаров недоступны\n';
  }

  const message = `💰 <b>Новая оплата через ЮKassa!</b> <i>(повтор)</i>

📦 <b>Заказ №:</b> ${order.orderNumber}
👤 <b>Клиент:</b> ${order.customerName}
${telegramUsername ? `👨‍💻 <b>Telegram:</b> ${telegramUsername}\n` : ''}📱 <b>Телефон:</b> ${order.customerPhone}
${order.customerEmail ? `📧 <b>Email:</b> ${order.customerEmail}\n` : ''}${itemsList}
🚚 <b>Доставка:</b> ${order.deliveryMethod}
💳 <b>Оплата:</b> ${order.paymentMethod}
💰 <b>Сумма:</b> ${order.totalPrice}₽
${order.paymentId ? `\n💳 <b>ID платежа:</b> ${order.paymentId}\n` : ''}
📅 <b>Дата:</b> ${new Date(order.createdAt).toLocaleString('ru-RU')}`;

  const adminRes = await sendTelegramHtml(ADMIN_CHAT_ID, message, { label: `boot-resend ${orderNumber} admin` });
  const adminOk = adminRes.ok;
  if (ORDERS_CHANNEL_ID) {
    await sendTelegramHtml(ORDERS_CHANNEL_ID, message, { label: `boot-resend ${orderNumber} channel` });
  }

  if (adminOk) {
    await markSent(orderNumber);
    console.log(`[BootResend] ${orderNumber}: отправлено ✅`);
  } else {
    console.warn(`[BootResend] ${orderNumber}: не отправлено, попробуем при следующем запуске`);
  }
}

export async function resendMissedNotificationsOnBoot(): Promise<void> {
  if (process.env.DISABLE_BOOT_RESEND === '1') return;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[BootResend] Пропуск: запускается только в production (NODE_ENV=production).');
    return;
  }
  console.log('[BootResend] Запуск проверки пропущенных уведомлений…');
  for (const orderNumber of ORDER_NUMBERS_TO_RESEND) {
    try {
      await sendOne(orderNumber);
    } catch (err: any) {
      console.error(`[BootResend] ${orderNumber}: ошибка ${err?.message || err}`);
    }
  }
  console.log('[BootResend] Завершено.');
}
