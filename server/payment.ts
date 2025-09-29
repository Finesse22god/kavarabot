import { API } from 'yoomoney-sdk';
import { v4 as uuidv4 } from 'uuid';

// Initialize YooMoney API
const getYooMoneyAPI = () => {
  const token = process.env.YOOMONEY_TOKEN;
  if (!token) {
    throw new Error('YOOMONEY_TOKEN is required');
  }
  return new API(token);
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

// Create payment intent for YooMoney
export async function createPaymentIntent({
  amount,
  description,
  orderId,
  returnUrl
}: {
  amount: number;
  description: string;
  orderId: string;
  returnUrl?: string;
}) {
  try {
    console.log("Creating YooKassa payment:", { amount, description, orderId });

    // Валидация параметров
    if (!process.env.YOOMONEY_SHOP_ID || !process.env.YOOMONEY_SECRET_KEY) {
      throw new Error("YooMoney credentials not configured");
    }

    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (amount > 100000) {
      throw new Error("Amount exceeds maximum limit");
    }

    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: "RUB"
      },
      confirmation: {
        type: "redirect",
        return_url: returnUrl || `https://ffda1710-e4e3-438f-aee0-891e4f004ca7-00-2fhb8prkicvnj.kirk.replit.dev/payment-success`
      },
      capture: true,
      description: description.substring(0, 128), // Ограничиваем длину описания
      metadata: {
        order_id: orderId,
        order_number: orderId // Добавляем номер заказа для удобства
      }
    };

    console.log("Payment data:", JSON.stringify(paymentData, null, 2));

    const authHeader = `Basic ${Buffer.from(`${process.env.YOOMONEY_SHOP_ID}:${process.env.YOOMONEY_SECRET_KEY}`).toString("base64")}`;

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Idempotence-Key": `${orderId}_${Date.now()}` // Уникальный ключ
      },
      body: JSON.stringify(paymentData)
    });

    console.log("YooKassa response status:", response.status);

    const result = await response.json();
    console.log("YooKassa response:", result);

    if (!response.ok) {
      console.error("Payment creation failed:", result);
      throw new Error(result.description || `Payment creation failed: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Payment creation error:", error);
    throw error;
  }
}

// Generate YooMoney payment form URL
function createPaymentFormUrl(params: Record<string, any>): string {
  const baseUrl = 'https://yoomoney.ru/quickpay/confirm.xml';
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    urlParams.append(key, String(value));
  });

  return `${baseUrl}?${urlParams.toString()}`;
}

// Check payment status using YooMoney API
export async function checkPaymentStatus(paymentId: string): Promise<PaymentIntent> {
  try {
    const api = getYooMoneyAPI();

    // Get operation history to find payment by label
    const history = await api.operationHistory({
      records: 100
    });

    const payment = history.operations?.find((op: any) => op.label === paymentId);

    if (payment) {
      return {
        id: paymentId,
        amount: parseFloat(payment.amount.toString()),
        status: payment.status === 'success' ? 'succeeded' : 'pending',
        description: payment.title || '',
        orderId: payment.label || paymentId
      };
    }

    return {
      id: paymentId,
      amount: 0,
      status: 'pending',
      description: '',
      orderId: paymentId
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

// Get account info
export async function getAccountInfo() {
  try {
    const api = getYooMoneyAPI();
    return await api.accountInfo();
  } catch (error) {
    console.error('Error getting account info:', error);
    throw error;
  }
}

// Handle webhook notification from YooMoney
export function parseYooMoneyNotification(body: any) {
  return {
    notification_type: body.notification_type,
    operation_id: body.operation_id,
    amount: parseFloat(body.amount || '0'),
    currency: body.currency || 'RUB',
    datetime: body.datetime,
    sender: body.sender,
    codepro: body.codepro === 'true',
    label: body.label,
    sha1_hash: body.sha1_hash
  };
}

// Verify notification authenticity
export function verifyNotification(notification: any, secret: string): boolean {
  const crypto = require('crypto');

  const string = [
    notification.notification_type,
    notification.operation_id,
    notification.amount,
    notification.currency,
    notification.datetime,
    notification.sender,
    notification.codepro,
    secret,
    notification.label
  ].join('&');

  const hash = crypto.createHash('sha1').update(string, 'utf8').digest('hex');
  return hash === notification.sha1_hash;
}