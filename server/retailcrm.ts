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
  offer?: { externalId?: string; name?: string; article?: string };
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

    const baseUrl = this.config.apiUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/api/v5/${endpoint}`;
    console.log(`[RetailCRM] Request: ${method} ${url}`);
    
    const headers: Record<string, string> = {};

    let options: any = { method, headers };

    if (method === "GET") {
      const params = new URLSearchParams();
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
        
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
          console.error(`[RetailCRM] Received HTML instead of JSON. Check API URL.`);
          throw new Error('Неверный API URL или API недоступен');
        }
        
        const result = JSON.parse(text);
        if (!response.ok || !result.success) {
          console.error(`[RetailCRM] Error response:`, JSON.stringify(result));
        }
        return result;
      } catch (error: any) {
        console.error(`[RetailCRM] Request failed:`, error.message);
        throw error;
      }
    } else {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      const formData = new URLSearchParams();
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
        console.log(`[RetailCRM] POST data keys: ${Object.keys(data || {}).join(', ')}`);
        if (data?.customer) {
          console.log(`[RetailCRM] Customer data: ${JSON.stringify(data.customer)}`);
        }
        if (data?.order) {
          console.log(`[RetailCRM] Order data: ${JSON.stringify(data.order)}`);
        }
        
        const response = await fetch(url, options);
        const text = await response.text();
        console.log(`[RetailCRM] Response status: ${response.status}, body: ${text.substring(0, 500)}`);
        
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
          console.error(`[RetailCRM] Received HTML instead of JSON. Check API URL.`);
          throw new Error('Неверный API URL или API недоступен');
        }
        
        const result = JSON.parse(text);
        if (!response.ok || !result.success) {
          console.error(`[RetailCRM] Error response:`, JSON.stringify(result));
          if (result.errors) {
            console.error(`[RetailCRM] Errors detail:`, JSON.stringify(result.errors));
          }
        }
        return result;
      } catch (error: any) {
        console.error(`[RetailCRM] Request failed:`, error.message);
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
    } catch (error: any) {
      console.error(`[RetailCRM] Failed to sync customer ${customer.externalId}:`, error.message);
      throw error;
    }
  }

  async createOrder(order: RetailCRMOrder): Promise<any> {
    if (!this.isConfigured()) {
      console.log("[RetailCRM] Not configured, skipping order sync");
      return null;
    }

    try {
      const existingResponse = await this.request("GET", "orders", {
        "filter[externalId]": order.externalId,
      });

      if (existingResponse.success && existingResponse.orders?.length > 0) {
        console.log(`[RetailCRM] Order ${order.externalId} already exists, updating...`);
        const result = await this.request("POST", `orders/${order.externalId}/edit`, {
          order,
          by: "externalId",
        });
        if (result.success) {
          console.log(`[RetailCRM] Order updated: ${order.externalId}`);
        }
        return result;
      } else {
        const result = await this.request("POST", "orders/create", {
          order,
        });
        if (result.success) {
          console.log(`[RetailCRM] Order created: ${order.externalId}`);
        }
        return result;
      }
    } catch (error: any) {
      console.error(`[RetailCRM] Failed to create/update order ${order.externalId}:`, error.message);
      throw error;
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

  async getOrderTypes(): Promise<any> {
    if (!this.isConfigured()) return null;
    try {
      return await this.request("GET", "reference/order-types");
    } catch (error) {
      console.error(`[RetailCRM] Failed to get order types:`, error);
      return null;
    }
  }

  async getDeliveryTypes(): Promise<any> {
    if (!this.isConfigured()) return null;
    try {
      return await this.request("GET", "reference/delivery-types");
    } catch (error) {
      console.error(`[RetailCRM] Failed to get delivery types:`, error);
      return null;
    }
  }

  async getPaymentTypes(): Promise<any> {
    if (!this.isConfigured()) return null;
    try {
      return await this.request("GET", "reference/payment-types");
    } catch (error) {
      console.error(`[RetailCRM] Failed to get payment types:`, error);
      return null;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: "RetailCRM не настроен" };
    }

    try {
      const result = await this.request("GET", "reference/sites");
      if (result.success) {
        const siteCount = Object.keys(result.sites || {}).length;
        return { 
          success: true, 
          message: `Подключено! Найдено магазинов: ${siteCount}` 
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
  const nameParts = (order.customerName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || user?.firstName || "Покупатель";
  const lastName = nameParts.slice(1).join(" ") || user?.lastName || "";

  const retailOrder: RetailCRMOrder = {
    externalId: order.orderNumber,
    number: order.orderNumber,
    firstName,
    lastName,
    phone: order.customerPhone || undefined,
    email: order.customerEmail || undefined,
    status: mapKavaraStatusToRetailCRM(order.status),
    customer: user?.telegramId ? { externalId: `tg_${user.telegramId}` } : undefined,
    customerComment: [
      user?.username ? `Telegram: @${user.username}` : '',
      order.deliveryAddress ? `Адрес: ${order.deliveryAddress}` : '',
    ].filter(Boolean).join('. ') || undefined,
    items: items.map((item) => ({
      productName: item.name || "Товар",
      initialPrice: item.price || 0,
      quantity: item.quantity || 1,
      properties: item.size ? [{ name: "Размер", value: item.size }] : [],
    })),
  };

  return retailOrder;
}

export function mapKavaraStatusToRetailCRM(kavaraStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: "new",
    paid: "complete",
    completed: "complete",
    cancelled: "cancel-other",
    shipped: "assembling",
    delivered: "complete",
  };
  return statusMap[kavaraStatus] || "new";
}

export function mapKavaraUserToRetailCRM(user: any, orderData?: any): RetailCRMCustomer {
  const firstName = user.firstName || (orderData?.customerName?.split(/\s+/)[0]) || (user.username ? `@${user.username}` : `TG_${user.telegramId}`);
  const lastName = user.lastName || (orderData?.customerName?.split(/\s+/).slice(1).join(" ")) || '';

  const phone = user.phone || orderData?.customerPhone;
  const email = orderData?.customerEmail;

  const customer: RetailCRMCustomer = {
    externalId: `tg_${user.telegramId}`,
    firstName,
    lastName,
    phones: phone ? [{ number: phone }] : undefined,
    email: email || undefined,
  };

  if (user.username) {
    customer.patronymic = `@${user.username}`;
  }

  return customer;
}
