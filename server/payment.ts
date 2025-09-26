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
export async function createPaymentIntent(paymentData: PaymentData): Promise<PaymentIntent> {
  const paymentId = uuidv4();
  
  // For YooMoney P2P, we create a payment form URL
  const baseUrl = 'https://ffda1710-e4e3-438f-aee0-891e4f004ca7-00-2fhb8prkicvnj.kirk.replit.dev';
  
  const paymentUrl = createPaymentFormUrl({
    receiver: process.env.YOOMONEY_WALLET || '4100119160773859',
    'quickpay-form': 'shop',
    targets: paymentData.description,
    'paymentType': 'AC',
    sum: paymentData.amount,
    'formcomment': paymentData.orderId,
    'short-dest': paymentData.description,
    label: paymentId,
    successURL: `https://t.me/kavaraappbot/app?startapp=payment_success`,
    'need-fio': false,
    'need-email': false,
    'need-phone': false,
    'need-address': false
  });

  return {
    id: paymentId,
    amount: paymentData.amount,
    status: 'pending',
    paymentUrl,
    description: paymentData.description,
    orderId: paymentData.orderId
  };
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