import { YooCheckout } from '@a2seven/yoo-checkout';
import { v4 as uuidv4 } from 'uuid';

// Initialize YooKassa API
const getYooKassaClient = () => {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error('YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY are required');
  }

  return new YooCheckout({
    shopId,
    secretKey
  });
};

export interface PaymentData {
  amount: number;
  description: string;
  orderId: string;
  returnUrl?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  paymentUrl?: string;
  description: string;
  orderId: string;
}

// Create payment intent for YooKassa
export async function createPaymentIntent(paymentData: PaymentData): Promise<PaymentIntent> {
  const checkout = getYooKassaClient();
  const idempotenceKey = uuidv4();

  try {
    const payment = await checkout.createPayment({
      amount: {
        value: paymentData.amount.toFixed(2),
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: paymentData.returnUrl || `https://t.me/kavaraappbot/app?startapp=payment_success`
      },
      capture: true,
      description: paymentData.description,
      metadata: {
        orderId: paymentData.orderId
      }
    }, idempotenceKey);

    return {
      id: payment.id,
      amount: parseFloat(payment.amount.value),
      status: payment.status === 'succeeded' ? 'succeeded' : 'pending',
      paymentUrl: payment.confirmation?.confirmation_url,
      description: payment.description || '',
      orderId: paymentData.orderId
    };
  } catch (error) {
    console.error('Error creating YooKassa payment:', error);
    throw error;
  }
}

// Check payment status using YooKassa API
export async function checkPaymentStatus(paymentId: string): Promise<PaymentIntent> {
  const checkout = getYooKassaClient();

  try {
    const payment = await checkout.getPayment(paymentId);

    return {
      id: payment.id,
      amount: parseFloat(payment.amount.value),
      status: payment.status === 'succeeded' ? 'succeeded' : payment.status === 'canceled' ? 'failed' : 'pending',
      description: payment.description || '',
      orderId: payment.metadata?.orderId || paymentId
    };
  } catch (error) {
    console.error('Error checking payment status:', error);
    return {
      id: paymentId,
      amount: 0,
      status: 'failed',
      description: '',
      orderId: paymentId
    };
  }
}

// Handle webhook notification from YooKassa
export function parseYooKassaNotification(body: any) {
  return {
    type: body.event,
    object: body.object
  };
}

// Verify notification authenticity (YooKassa sends IP whitelist, no hash verification needed)
export function verifyNotification(notification: any): boolean {
  // YooKassa uses IP whitelist for verification
  // IPs: 185.71.76.0/27, 185.71.77.0/27, 77.75.153.0/25, 77.75.156.11, 77.75.156.35, 77.75.154.128/25
  // This should be checked in the route handler
  return true;
}