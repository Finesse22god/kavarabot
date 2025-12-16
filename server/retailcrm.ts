import fetch from "node-fetch";

interface RetailCRMConfig {
  apiUrl: string;
  apiKey: string;
  siteCode?: string;
}

interface RetailCRMCustomer {
  externalId: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  email?: string;
  phones?: Array<{ number: string }>;
  customFields?: Record<string, any>;
}

interface RetailCRMOrderItem {
  offer?: { externalId?: string; name?: string };
  productName?: string;
  initialPrice: number;
  quantity: number;
  properties?: Array<{ name: string; value: string }>;
}

interface RetailCRMOrder {
  externalId: string;
  number?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  customerComment?: string;
  status?: string;
  orderType?: string;
  orderMethod?: string;
  customer?: { externalId: string };
  items?: RetailCRMOrderItem[];
  delivery?: {
    code?: string;
    address?: { text?: string };
  };
  payments?: Array<{
    type?: string;
    status?: string;
    amount?: number;
  }>;
  customFields?: Record<string, any>;
}

class RetailCRMService {
  private config: RetailCRMConfig | null = null;

  configure(config: RetailCRMConfig) {
    this.config = config;
    console.log(`[RetailCRM] Configured with URL: ${config.apiUrl}`);
  }

  isConfigured(): boolean {
    return !!(this.config?.apiUrl && this.config?.apiKey);
  }

  private async request(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<any> {
    if (!this.config) {
      throw new Error("RetailCRM not configured");
    }

    // Clean up URL - remove trailing slash if present
    const baseUrl = this.config.apiUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/api/v5/${endpoint}`;
    console.log(`[RetailCRM] Request: ${method} ${url}`);
    
    const headers: Record<string, string> = {};

    let options: any = { method, headers };

    if (method === "GET") {
      const params = new URLSearchParams();
      // Add API key as query parameter (RetailCRM requirement)
      params.append("apiKey", this.config.apiKey);
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === "object") {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      }
      const fullUrl = `${url}?${params}`;
      options = { method, headers };
      
      try {
        const response = await fetch(fullUrl, options);
        const text = await response.text();
        console.log(`[RetailCRM] Response status: ${response.status}`);
        
        // Check if response is HTML (error page)
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
          console.error(`[RetailCRM] Received HTML instead of JSON. Check API URL.`);
          throw new Error('Неверный API URL или API недоступен');
        }
        
        const result = JSON.parse(text);
        if (!response.ok || !result.success) {
          console.error(`[RetailCRM] Error:`, result);
        }
        return result;
      } catch (error: any) {
        console.error(`[RetailCRM] Request failed:`, error);
        throw error;
      }
    } else {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      const formData = new URLSearchParams();
      // Add API key as form parameter (RetailCRM requirement)
      formData.append("apiKey", this.config.apiKey);
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      }
      if (this.config.siteCode) {
        formData.append("site", this.config.siteCode);
      }
      options.body = formData;

      try {
        const response = await fetch(url, options);
        const text = await response.text();
        console.log(`[RetailCRM] Response status: ${response.status}`);
        
        // Check if response is HTML (error page)
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
          console.error(`[RetailCRM] Received HTML instead of JSON. Check API URL.`);
          throw new Error('Неверный API URL или API недоступен');
        }
        
        const result = JSON.parse(text);
        if (!response.ok || !result.success) {
          console.error(`[RetailCRM] Error:`, result);
        }
        return result;
      } catch (error: any) {
        console.error(`[RetailCRM] Request failed:`, error);
        throw error;
      }
    }
  }

  async createOrUpdateCustomer(customer: RetailCRMCustomer): Promise<any> {
    if (!this.isConfigured()) {
      console.log("[RetailCRM] Not configured, skipping customer sync");
      return null;
    }

    try {
      const existingResponse = await this.request("GET", "customers", {
        "filter[externalId]": customer.externalId,
      });

      if (existingResponse.success && existingResponse.customers?.length > 0) {
        const result = await this.request("POST", `customers/${customer.externalId}/edit`, {
          customer,
          by: "externalId",
        });
        console.log(`[RetailCRM] Customer updated: ${customer.externalId}`);
        return result;
      } else {
        const result = await this.request("POST", "customers/create", {
          customer,
        });
        console.log(`[RetailCRM] Customer created: ${customer.externalId}`);
        return result;
      }
    } catch (error) {
      console.error(`[RetailCRM] Failed to sync customer:`, error);
      return null;
    }
  }

  async createOrder(order: RetailCRMOrder): Promise<any> {
    if (!this.isConfigured()) {
      console.log("[RetailCRM] Not configured, skipping order sync");
      return null;
    }

    try {
      const result = await this.request("POST", "orders/create", {
        order,
      });
      if (result.success) {
        console.log(`[RetailCRM] Order created: ${order.externalId}`);
      }
      return result;
    } catch (error) {
      console.error(`[RetailCRM] Failed to create order:`, error);
      return null;
    }
  }

  async updateOrderStatus(
    externalId: string,
    status: string
  ): Promise<any> {
    if (!this.isConfigured()) {
      console.log("[RetailCRM] Not configured, skipping order status update");
      return null;
    }

    try {
      const result = await this.request("POST", `orders/${externalId}/edit`, {
        order: { status },
        by: "externalId",
      });
      if (result.success) {
        console.log(`[RetailCRM] Order ${externalId} status updated to: ${status}`);
      }
      return result;
    } catch (error) {
      console.error(`[RetailCRM] Failed to update order status:`, error);
      return null;
    }
  }

  async getOrderStatuses(): Promise<any> {
    if (!this.isConfigured()) return null;
    try {
      return await this.request("GET", "reference/statuses");
    } catch (error) {
      console.error(`[RetailCRM] Failed to get statuses:`, error);
      return null;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: "RetailCRM не настроен" };
    }

    try {
      // Use api-versions endpoint for connection test (lightweight, always available)
      const result = await this.request("GET", "api-versions");
      if (result.success) {
        const versions = result.versions?.join(", ") || "v5";
        return { 
          success: true, 
          message: `Подключено! Доступные версии API: ${versions}` 
        };
      } else {
        return { 
          success: false, 
          message: result.errorMsg || "Неверный API ключ" 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || "Ошибка подключения" 
      };
    }
  }
}

export const retailCRM = new RetailCRMService();

export function mapKavaraOrderToRetailCRM(
  order: any,
  user: any,
  items: any[]
): RetailCRMOrder {
  const retailOrder: RetailCRMOrder = {
    externalId: order.orderNumber,
    number: order.orderNumber,
    firstName: order.customerName?.split(" ")[0] || user?.firstName || "",
    lastName: order.customerName?.split(" ").slice(1).join(" ") || user?.lastName || "",
    phone: order.customerPhone,
    email: order.customerEmail,
    status: mapKavaraStatusToRetailCRM(order.status),
    orderType: "telegram-bot",
    orderMethod: "telegram",
    items: items.map((item) => ({
      productName: item.name,
      initialPrice: item.price,
      quantity: item.quantity || 1,
      properties: item.size ? [{ name: "Размер", value: item.size }] : [],
    })),
    customFields: {
      telegram_id: user?.telegramId,
      telegram_username: user?.username,
    },
  };

  if (user?.telegramId) {
    retailOrder.customer = { externalId: `tg_${user.telegramId}` };
  }

  if (order.totalPrice) {
    retailOrder.payments = [
      {
        type: order.paymentMethod === "card" ? "bank-card" : "cash",
        status: order.status === "paid" ? "paid" : "not-paid",
        amount: order.totalPrice,
      },
    ];
  }

  return retailOrder;
}

export function mapKavaraStatusToRetailCRM(kavaraStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: "new",
    paid: "complete",
    completed: "complete",
    cancelled: "cancel-other",
    shipped: "send-to-delivery",
    delivered: "complete",
  };
  return statusMap[kavaraStatus] || "new";
}

export function mapKavaraUserToRetailCRM(user: any): RetailCRMCustomer {
  return {
    externalId: `tg_${user.telegramId}`,
    firstName: user.firstName,
    lastName: user.lastName,
    phones: user.phone ? [{ number: user.phone }] : undefined,
    customFields: {
      telegram_id: user.telegramId,
      telegram_username: user.username,
      loyalty_points: user.loyaltyPoints,
    },
  };
}
