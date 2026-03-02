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
  customerComment?: string;
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
      // IMPORTANT: URLSearchParams encodes square brackets (filter[email] → filter%5Bemail%5D)
      // RetailCRM requires literal square brackets in filter params, so build query string manually
      const queryParts: string[] = [`apiKey=${encodeURIComponent(this.config.apiKey)}`];
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          const strValue = typeof value === "object" ? JSON.stringify(value) : String(value);
          // Key is NOT encoded (preserves filter[xxx] brackets), value IS encoded
          queryParts.push(`${key}=${encodeURIComponent(strValue)}`);
        }
      }
      const fullUrl = `${url}?${queryParts.join('&')}`;
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

  async getCustomerByEmail(email: string): Promise<any | null> {
    if (!this.isConfigured() || !email) return null;
    try {
      const response = await this.request("GET", "customers", {
        "filter[email]": email,
        "limit": 1,
      });
      if (response.success && response.customers?.length > 0) {
        console.log(`[RetailCRM] Found customer by email: ${email}`);
        return response.customers[0];
      }
      return null;
    } catch (error: any) {
      console.error(`[RetailCRM] getCustomerByEmail error:`, error.message);
      return null;
    }
  }

  async getCustomerByPhone(phone: string): Promise<any | null> {
    if (!this.isConfigured() || !phone) return null;
    try {
      const normalizedPhone = phone.replace(/\D/g, '');
      const response = await this.request("GET", "customers", {
        "filter[phone]": normalizedPhone,
        "limit": 1,
      });
      if (response.success && response.customers?.length > 0) {
        console.log(`[RetailCRM] Found customer by phone: ${phone}`);
        return response.customers[0];
      }
      return null;
    } catch (error: any) {
      console.error(`[RetailCRM] getCustomerByPhone error:`, error.message);
      return null;
    }
  }

  async getCustomerByExternalId(externalId: string): Promise<any | null> {
    if (!this.isConfigured() || !externalId) return null;
    try {
      const response = await this.request("GET", "customers", {
        "filter[externalId]": externalId,
        "limit": 1,
      });
      if (response.success && response.customers?.length > 0) {
        return response.customers[0];
      }
      return null;
    } catch (error: any) {
      console.error(`[RetailCRM] getCustomerByExternalId error:`, error.message);
      return null;
    }
  }

  async getLoyaltyAccountByExternalId(externalId: string): Promise<any | null> {
    if (!this.isConfigured()) return null;
    try {
      // Filter by customerExternalId as per RetailCRM API v5 docs
      const directResponse = await this.request("GET", "loyalty/accounts", {
        "filter[customerExternalId]": externalId,
        "limit": 1,
      });
      if (directResponse.success && directResponse.loyaltyAccounts?.length > 0) {
        console.log(`[RetailCRM] Found loyalty account for ${externalId} (by customerExternalId)`);
        return directResponse.loyaltyAccounts[0];
      }

      // Fallback: find customer first, then find loyalty account by customerId
      const customer = await this.getCustomerByExternalId(externalId);
      if (!customer?.id) return null;

      const response = await this.request("GET", "loyalty/accounts", {
        "filter[customerId]": customer.id,
        "limit": 1,
      });
      if (response.success && response.loyaltyAccounts?.length > 0) {
        console.log(`[RetailCRM] Found loyalty account for ${externalId} (by customerId ${customer.id})`);
        return response.loyaltyAccounts[0];
      }
      return null;
    } catch (error: any) {
      console.error(`[RetailCRM] getLoyaltyAccountByExternalId error:`, error.message);
      return null;
    }
  }

  async getLoyaltyAccountByCrmId(crmCustomerId: string): Promise<any | null> {
    if (!this.isConfigured() || !crmCustomerId) return null;
    try {
      const response = await this.request("GET", "loyalty/accounts", {
        "filter[customerId]": crmCustomerId,
        "limit": 1,
      });
      if (response.success && response.loyaltyAccounts?.length > 0) {
        console.log(`[RetailCRM] Found loyalty account by CRM ID ${crmCustomerId}`);
        return response.loyaltyAccounts[0];
      }
      return null;
    } catch (error: any) {
      console.error(`[RetailCRM] getLoyaltyAccountByCrmId error:`, error.message);
      return null;
    }
  }

  async getLoyaltyAccountByEmail(email: string): Promise<any | null> {
    if (!this.isConfigured() || !email) return null;
    try {
      // Get all customers matching this email (there may be duplicates)
      const customersResp = await this.request("GET", "customers", {
        "filter[email]": email,
      });
      if (!customersResp.success || !customersResp.customers?.length) return null;

      // Check each customer for a loyalty account — return first one found
      for (const customer of customersResp.customers) {
        const loyaltyResp = await this.request("GET", "loyalty/accounts", {
          "filter[customerId]": customer.id,
          "limit": 1,
        });
        if (loyaltyResp.success && loyaltyResp.loyaltyAccounts?.length > 0) {
          console.log(`[RetailCRM] Found loyalty account by email ${email} (customerId ${customer.id})`);
          return loyaltyResp.loyaltyAccounts[0];
        }
      }
      return null;
    } catch (error: any) {
      console.error(`[RetailCRM] getLoyaltyAccountByEmail error:`, error.message);
      return null;
    }
  }

  async getLoyaltyAccountByPhone(phone: string): Promise<any | null> {
    if (!this.isConfigured() || !phone) return null;
    try {
      const normalizedPhone = phone.replace(/\D/g, '');
      // Get all customers matching this phone (there may be duplicates)
      const customersResp = await this.request("GET", "customers", {
        "filter[phone]": normalizedPhone,
      });
      if (!customersResp.success || !customersResp.customers?.length) return null;

      // Check each customer for a loyalty account — return first one found
      for (const customer of customersResp.customers) {
        const loyaltyResp = await this.request("GET", "loyalty/accounts", {
          "filter[customerId]": customer.id,
          "limit": 1,
        });
        if (loyaltyResp.success && loyaltyResp.loyaltyAccounts?.length > 0) {
          console.log(`[RetailCRM] Found loyalty account by phone (customerId ${customer.id})`);
          return loyaltyResp.loyaltyAccounts[0];
        }
      }
      return null;
    } catch (error: any) {
      console.error(`[RetailCRM] getLoyaltyAccountByPhone error:`, error.message);
      return null;
    }
  }

  async getCustomerPoints(
    externalId: string,
    opts?: { crmCustomerId?: string; email?: string; phone?: string }
  ): Promise<number | null> {
    if (!this.isConfigured()) return null;
    try {
      // 1. Try by saved CRM customer ID (fastest, most direct)
      if (opts?.crmCustomerId) {
        const account = await this.getLoyaltyAccountByCrmId(opts.crmCustomerId);
        if (account) {
          const balance = account.amount ?? null;
          if (balance !== null) {
            console.log(`[RetailCRM] Balance for ${externalId} (by crmCustomerId): ${balance}`);
            return Number(balance);
          }
        }
      }

      // 2. Try by externalId (tg_xxx)
      const accountByExtId = await this.getLoyaltyAccountByExternalId(externalId);
      if (accountByExtId) {
        const balance = accountByExtId.amount ?? null;
        if (balance !== null) {
          console.log(`[RetailCRM] Balance for ${externalId} (by externalId): ${balance}`);
          return Number(balance);
        }
      }

      // 3. Try by email — finds original customer even if duplicate exists
      if (opts?.email) {
        const accountByEmail = await this.getLoyaltyAccountByEmail(opts.email);
        if (accountByEmail) {
          const balance = accountByEmail.amount ?? null;
          if (balance !== null) {
            console.log(`[RetailCRM] Balance for ${externalId} (by email ${opts.email}): ${balance}`);
            return Number(balance);
          }
        }
      }

      // 4. Try by phone
      if (opts?.phone) {
        const accountByPhone = await this.getLoyaltyAccountByPhone(opts.phone);
        if (accountByPhone) {
          const balance = accountByPhone.amount ?? null;
          if (balance !== null) {
            console.log(`[RetailCRM] Balance for ${externalId} (by phone): ${balance}`);
            return Number(balance);
          }
        }
      }

      return null;
    } catch (error: any) {
      console.error(`[RetailCRM] getCustomerPoints error:`, error.message);
      return null;
    }
  }

  async creditPoints(loyaltyAccountId: number | string, amount: number, comment?: string): Promise<any> {
    if (!this.isConfigured()) return null;
    try {
      // RetailCRM API v5: POST /loyalty/account/{id}/bonus/credit
      // Params: amount (float), activationDate (Y-m-d), expireDate (Y-m-d), comment (string)
      const activationDate = new Date().toISOString().split('T')[0];
      const result = await this.request("POST", `loyalty/account/${loyaltyAccountId}/bonus/credit`, {
        "amount": Math.max(0, amount),
        "activationDate": activationDate,
        "comment": comment || "Начислено через Telegram Mini App",
      });
      if (result.success) {
        console.log(`[RetailCRM] Credited ${amount} points to account ${loyaltyAccountId}`);
      }
      return result;
    } catch (error: any) {
      console.error(`[RetailCRM] creditPoints error:`, error.message);
      return null;
    }
  }

  async chargePoints(loyaltyAccountId: number | string, amount: number, comment?: string): Promise<any> {
    if (!this.isConfigured()) return null;
    try {
      // RetailCRM API v5: POST /loyalty/account/{id}/bonus/charge
      // Params: amount (float), comment (string)
      const result = await this.request("POST", `loyalty/account/${loyaltyAccountId}/bonus/charge`, {
        "amount": Math.max(0, amount),
        "comment": comment || "Списано через Telegram Mini App",
      });
      if (result.success) {
        console.log(`[RetailCRM] Charged ${amount} points from account ${loyaltyAccountId}`);
      }
      return result;
    } catch (error: any) {
      console.error(`[RetailCRM] chargePoints error:`, error.message);
      return null;
    }
  }

  async updateCustomerPoints(
    externalId: string,
    newBalance: number,
    comment?: string,
    opts?: { crmCustomerId?: string; email?: string; phone?: string }
  ): Promise<any> {
    if (!this.isConfigured()) return null;
    try {
      // Try to find loyalty account via multiple strategies
      let account: any = null;

      if (opts?.crmCustomerId) {
        account = await this.getLoyaltyAccountByCrmId(opts.crmCustomerId);
      }
      if (!account) {
        account = await this.getLoyaltyAccountByExternalId(externalId);
      }
      if (!account && opts?.email) {
        account = await this.getLoyaltyAccountByEmail(opts.email);
      }
      if (!account && opts?.phone) {
        account = await this.getLoyaltyAccountByPhone(opts.phone);
      }

      if (!account) {
        console.log(`[RetailCRM] No loyalty account found for ${externalId}, skipping points update`);
        return null;
      }

      // RetailCRM API v5: balance is in `amount` field of loyalty account
      const currentBalance = Number(account.amount ?? 0);
      const delta = newBalance - currentBalance;

      if (delta === 0) {
        console.log(`[RetailCRM] Points unchanged for ${externalId}: ${currentBalance}`);
        return { success: true, unchanged: true };
      }

      if (delta > 0) {
        return await this.creditPoints(account.id, delta, comment || "Начислено через Telegram Mini App");
      } else {
        return await this.chargePoints(account.id, Math.abs(delta), comment || "Списано через Telegram Mini App");
      }
    } catch (error: any) {
      console.error(`[RetailCRM] updateCustomerPoints error:`, error.message);
      return null;
    }
  }

  async createOrUpdateCustomer(customer: RetailCRMCustomer): Promise<{ result: any; crmCustomerId?: string }> {
    if (!this.isConfigured()) {
      console.log("[RetailCRM] Not configured, skipping customer sync");
      return { result: null };
    }

    try {
      let existingCustomer: any = null;
      let foundBy: string | null = null;

      if (customer.email) {
        existingCustomer = await this.getCustomerByEmail(customer.email);
        if (existingCustomer) foundBy = 'email';
      }

      if (!existingCustomer && customer.phones?.[0]?.number) {
        existingCustomer = await this.getCustomerByPhone(customer.phones[0].number);
        if (existingCustomer) foundBy = 'phone';
      }

      if (!existingCustomer) {
        existingCustomer = await this.getCustomerByExternalId(customer.externalId);
        if (existingCustomer) foundBy = 'externalId';
      }

      const siteCode = this.config?.siteCode || 'kavarabrand2';

      if (existingCustomer) {
        const editId = existingCustomer.id;

        // When found by email/phone: do NOT set externalId to avoid conflicts
        // with another record that may already have our tg_ externalId.
        // When found by our own externalId: safe to update fully.
        const updateData: any = {
          firstName: customer.firstName,
          lastName: customer.lastName,
          phones: customer.phones,
          email: customer.email,
          customerComment: customer.customerComment,
          site: siteCode,
        };
        if (foundBy === 'externalId') {
          updateData.externalId = customer.externalId;
        }

        const result = await this.request("POST", `customers/${editId}/edit`, {
          customer: updateData,
          by: "id",
          site: siteCode,
        });
        console.log(`[RetailCRM] Customer updated (found by ${foundBy}, id: ${editId})`);
        return { result, crmCustomerId: String(existingCustomer.id) };
      } else {
        const result = await this.request("POST", "customers/create", {
          customer: { ...customer, site: siteCode },
          site: siteCode,
        });
        console.log(`[RetailCRM] Customer created: ${customer.externalId}`);
        const crmId = result.id ? String(result.id) : customer.externalId;
        return { result, crmCustomerId: crmId };
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
  const retailOrder: RetailCRMOrder = {
    externalId: order.orderNumber,
    number: order.orderNumber,
    status: mapKavaraStatusToRetailCRM(order.status),
    customer: user?.telegramId ? { externalId: `tg_${user.telegramId}` } : undefined,
    customerComment: [
      user?.username ? `Telegram: @${user.username}` : '',
      order.deliveryAddress ? `Адрес: ${order.deliveryAddress}` : '',
      order.customerPhone ? `Тел: ${order.customerPhone}` : '',
      order.customerEmail ? `Email: ${order.customerEmail}` : '',
    ].filter(Boolean).join('. ') || undefined,
    items: items.map((item) => ({
      productName: item.name || "Товар",
      initialPrice: item.price || 0,
      quantity: item.quantity || 1,
      properties: item.size ? [{ name: "Размер", value: item.size }] : [],
    })),
  };

  if (!retailOrder.customer) {
    const nameParts = (order.customerName || '').trim().split(/\s+/);
    retailOrder.firstName = nameParts[0] || user?.firstName || "Покупатель";
    retailOrder.lastName = nameParts.slice(1).join(" ") || user?.lastName || "";
    retailOrder.phone = order.customerPhone || undefined;
    retailOrder.email = order.customerEmail || undefined;
  }

  if (order.totalPrice) {
    const isPaid = ["paid", "completed", "shipped", "delivered"].includes(order.status);
    retailOrder.payments = [
      {
        status: isPaid ? "paid" : "not-paid",
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
    shipped: "assembling",
    delivered: "complete",
  };
  return statusMap[kavaraStatus] || "new";
}

export function mapKavaraUserToRetailCRM(user: any, orderData?: any): RetailCRMCustomer {
  const firstName = user.firstName || (orderData?.customerName?.split(/\s+/)[0]) || (user.username ? `@${user.username}` : `TG_${user.telegramId}`);
  const lastName = user.lastName || (orderData?.customerName?.split(/\s+/).slice(1).join(" ")) || '';

  const phone = user.phone || orderData?.customerPhone;
  const email = user.email || orderData?.customerEmail;

  const loyaltyInfo = [];
  if (user.loyaltyPoints !== undefined && user.loyaltyPoints !== null) {
    loyaltyInfo.push(`Баллы: ${user.loyaltyPoints}`);
  }
  if (user.referralCode) {
    loyaltyInfo.push(`Промокод: ${user.referralCode}`);
  }

  const commentParts = [];
  if (user.username) commentParts.push(`Telegram: @${user.username}`);
  if (user.telegramId) commentParts.push(`TG ID: ${user.telegramId}`);
  if (loyaltyInfo.length > 0) commentParts.push(loyaltyInfo.join(', '));

  const customer: RetailCRMCustomer = {
    externalId: `tg_${user.telegramId}`,
    firstName,
    lastName,
    phones: phone ? [{ number: phone.replace(/\D/g, '') }] : undefined,
    email: email || undefined,
    customerComment: commentParts.length > 0 ? commentParts.join('. ') : undefined,
  };

  if (user.username) {
    customer.patronymic = `@${user.username}`;
  }

  return customer;
}
