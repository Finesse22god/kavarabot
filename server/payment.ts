import { YooCheckout } from "@a2seven/yoo-checkout";
import { v4 as uuidv4 } from "uuid";

// Initialize YooKassa API
const getYooKassaClient = () => {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error("YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY are required");
  }

  return new YooCheckout({
    shopId,
    secretKey,
  });
};

export interface PaymentData {
  amount: number;
  description: string;
  orderId: string;
  returnUrl?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  status: "pending" | "succeeded" | "failed";
  paymentUrl?: string;
  description: string;
  orderId: string;
}

// Create payment intent for YooKassa
export async function createPaymentIntent(
  paymentData: PaymentData,
): Promise<PaymentIntent> {
  const checkout = getYooKassaClient();
  const idempotenceKey = uuidv4();

  try {
    // Prepare receipt data (required by 54-ФЗ)
    const receipt: any = {
      customer: {},
      items: [
        {
          description: paymentData.description,
          quantity: "1.00",
          amount: {
            value: paymentData.amount.toFixed(2),
            currency: "RUB",
          },
          vat_code: 1, // НДС 20%
        },
      ],
    };

    // Add customer contact (email or phone is required)
    if (paymentData.customerEmail) {
      receipt.customer.email = paymentData.customerEmail;
    }
    if (paymentData.customerPhone) {
      receipt.customer.phone = paymentData.customerPhone;
    }

    const payment = await checkout.createPayment(
      {
        amount: {
          value: paymentData.amount.toFixed(2),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url:
            paymentData.returnUrl ||
            `https://t.me/kavaraappbot/app?startapp=payment_success`,
        },
        capture: true,
        description: paymentData.description,
        receipt: receipt,
        metadata: {
          orderId: paymentData.orderId,
        },
      },
      idempotenceKey,
    );

    console.log("Payment created:", payment.confirmation);

    return {
      id: payment.id,
      amount: parseFloat(payment.amount.value),
      status: payment.status === "succeeded" ? "succeeded" : "pending",
      paymentUrl: payment.confirmation?.confirmation_url,
      description: payment.description || "",
      orderId: paymentData.orderId,
    };
  } catch (error: any) {
    console.error("Error creating YooKassa payment:", error);
    
    // Extract meaningful error information from axios error
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("YooKassa API Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Create a more informative error
      const apiError = new Error(
        `YooKassa API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`
      );
      throw apiError;
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response from YooKassa:", error.request);
      throw new Error("No response from YooKassa API");
    } else {
      // Something happened in setting up the request
      console.error("Error setting up request:", error.message);
      throw error;
    }
  }
}

// Check payment status using YooKassa API
export async function checkPaymentStatus(
  paymentId: string,
): Promise<PaymentIntent> {
  const checkout = getYooKassaClient();

  try {
    const payment = await checkout.getPayment(paymentId);

    return {
      id: payment.id,
      amount: parseFloat(payment.amount.value),
      status:
        payment.status === "succeeded"
          ? "succeeded"
          : payment.status === "canceled"
            ? "failed"
            : "pending",
      description: payment.description || "",
      orderId: payment.metadata?.orderId || paymentId,
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return {
      id: paymentId,
      amount: 0,
      status: "failed",
      description: "",
      orderId: paymentId,
    };
  }
}

// Handle webhook notification from YooKassa
export function parseYooKassaNotification(body: any) {
  return {
    type: body.event,
    object: body.object,
  };
}

// Verify notification authenticity (YooKassa sends IP whitelist, no hash verification needed)
export function verifyNotification(notification: any): boolean {
  // YooKassa uses IP whitelist for verification
  // IPs: 185.71.76.0/27, 185.71.77.0/27, 77.75.153.0/25, 77.75.156.11, 77.75.156.35, 77.75.154.128/25
  // This should be checked in the route handler
  return true;
}
