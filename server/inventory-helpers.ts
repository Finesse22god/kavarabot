import { EntityManager } from "typeorm";
import { Product } from "./entities/Product";
import { Box } from "./entities/Box";
import { InventoryHistory } from "./entities/InventoryHistory";
import { Order } from "./entities/Order";

export interface OrderItem {
  type: 'product' | 'box';
  id: string;
  size?: string;
  quantity: number;
}

/**
 * Извлекает нормализованный список товаров из заказа
 * Принимает либо DTO (при создании), либо Order entity (при отмене)
 */
export function extractOrderItems(orderData: any): OrderItem[] {
  const items: OrderItem[] = [];

  // Single box order
  if (orderData.boxId) {
    items.push({
      type: 'box',
      id: orderData.boxId,
      size: orderData.selectedSize,
      quantity: 1
    });
  }

  // Single product order
  if (orderData.productId) {
    items.push({
      type: 'product',
      id: orderData.productId,
      size: orderData.selectedSize,
      quantity: 1
    });
  }

  // Cart items - может быть либо массивом (DTO) либо JSON строкой (Order entity)
  let cartItems = orderData.cartItems;
  if (typeof cartItems === 'string') {
    try {
      cartItems = JSON.parse(cartItems);
    } catch (e) {
      console.error('Failed to parse cartItems:', e);
      cartItems = null;
    }
  }

  if (cartItems && Array.isArray(cartItems)) {
    for (const item of cartItems) {
      items.push({
        type: item.type,
        id: item.id,
        size: item.size,
        quantity: item.quantity || 1
      });
    }
  }

  // Aggregate items by type, id, and size to avoid duplicates
  const aggregated = new Map<string, OrderItem>();
  for (const item of items) {
    const key = `${item.type}-${item.id}-${item.size || 'nosize'}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      aggregated.set(key, { ...item });
    }
  }

  return Array.from(aggregated.values());
}

/**
 * Уменьшает остатки товаров и создает записи в истории
 * @param manager - EntityManager для транзакции
 * @param order - Созданный заказ
 * @param mode - 'sale' (продажа) или 'refund' (возврат при отмене)
 */
export async function adjustInventory(
  manager: EntityManager,
  order: Order,
  mode: 'sale' | 'refund'
): Promise<void> {
  const items = extractOrderItems(order);
  const ProductRepo = manager.getRepository(Product);
  const BoxRepo = manager.getRepository(Box);
  const HistoryRepo = manager.getRepository(InventoryHistory);

  for (const item of items) {
    if (item.type === 'product') {
      // Lock product row
      const product = await ProductRepo.findOne({
        where: { id: item.id },
        lock: { mode: 'pessimistic_write' }
      });

      if (!product) {
        throw new Error(`Товар с ID ${item.id} не найден`);
      }

      // Validate inventory exists for sales
      if (mode === 'sale' && !product.inventory) {
        throw new Error(
          `Товар "${product.name}" не имеет настроенных остатков. ` +
          `Пожалуйста, добавьте остатки в разделе "Остатки" админ-панели.`
        );
      }

      // Get current inventory - initialize if null for refunds only
      const inventory = product.inventory || {};
      const size = item.size || 'default';
      const currentQty = inventory[size] || 0;

      // Calculate new quantity
      const quantityChange = mode === 'sale' ? -item.quantity : item.quantity;
      const newQty = currentQty + quantityChange;

      // Check stock sufficiency for sales
      if (mode === 'sale' && newQty < 0) {
        throw new Error(
          `Недостаточно товара "${product.name}" размера ${size}. ` +
          `Доступно: ${currentQty}, требуется: ${item.quantity}`
        );
      }

      // Update inventory using targeted update
      const updatedInventory = { ...inventory, [size]: Math.max(0, newQty) };
      await ProductRepo.update(
        { id: product.id },
        { inventory: updatedInventory }
      );

      // Create history record
      const historyEntry = HistoryRepo.create({
        productId: product.id,
        size: item.size,
        type: mode === 'sale' ? 'sale' : 'correction',
        quantity: quantityChange,
        balanceAfter: newQty,
        orderId: order.id,
        note: mode === 'sale' 
          ? `Продажа по заказу ${order.orderNumber}` 
          : `Возврат при отмене заказа ${order.orderNumber}`
      });
      await manager.save(historyEntry);

    } else if (item.type === 'box') {
      // Lock box row
      const box = await BoxRepo.findOne({
        where: { id: item.id },
        lock: { mode: 'pessimistic_write' }
      });

      if (!box) {
        throw new Error(`Бокс с ID ${item.id} не найден`);
      }

      // Validate inventory exists for sales
      if (mode === 'sale' && !box.inventory) {
        throw new Error(
          `Бокс "${box.name}" не имеет настроенных остатков. ` +
          `Пожалуйста, добавьте остатки в разделе "Остатки" админ-панели.`
        );
      }

      // Get current inventory - initialize if null for refunds only
      const inventory = box.inventory || {};
      const size = item.size || 'default';
      const currentQty = inventory[size] || 0;

      // Calculate new quantity
      const quantityChange = mode === 'sale' ? -item.quantity : item.quantity;
      const newQty = currentQty + quantityChange;

      // Check stock sufficiency for sales
      if (mode === 'sale' && newQty < 0) {
        throw new Error(
          `Недостаточно бокса "${box.name}" размера ${size}. ` +
          `Доступно: ${currentQty}, требуется: ${item.quantity}`
        );
      }

      // Update inventory using targeted update
      const updatedInventory = { ...inventory, [size]: Math.max(0, newQty) };
      await BoxRepo.update(
        { id: box.id },
        { inventory: updatedInventory }
      );

      // Create history record
      const historyEntry = HistoryRepo.create({
        boxId: box.id,
        size: item.size,
        type: mode === 'sale' ? 'sale' : 'correction',
        quantity: quantityChange,
        balanceAfter: newQty,
        orderId: order.id,
        note: mode === 'sale' 
          ? `Продажа по заказу ${order.orderNumber}` 
          : `Возврат при отмене заказа ${order.orderNumber}`
      });
      await manager.save(historyEntry);
    }
  }
}
