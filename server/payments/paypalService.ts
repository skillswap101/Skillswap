import { dbStore } from '../dbStore';
import { notificationService } from '../notificationService';

export interface PaypalOrderRequest {
  userId: string;
  creditHours: number;
  amountUSD: number;
}

export class PaypalService {
  private clientId = process.env.PAYPAL_CLIENT_ID;
  private clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  private apiUrl = process.env.PAYPAL_API;
  private env = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

  private getBaseUrl(): string {
    if (this.apiUrl) return this.apiUrl.replace(/\/+$/, '');
    return this.env === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.clientId || !this.clientSecret) return null;
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const res = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
      if (res.ok) {
        const data = await res.json();
        return data.access_token;
      }
    } catch (err: any) {
      console.warn('PayPal OAuth token fetch failed:', err.message);
    }
    return null;
  }

  public async createOrder(params: PaypalOrderRequest) {
    const { userId, creditHours, amountUSD } = params;
    const user = dbStore.getUser(userId);
    if (!user) throw new Error(`User ${userId} not found`);

    const orderId = `PAYID_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Record order in dbStore
    const dbOrder = dbStore.createOrder({
      userId,
      gateway: 'paypal',
      amountUSD,
      creditHours,
      status: 'pending',
      currency: 'USD',
      gatewayTransactionId: orderId,
      metadata: { intent: 'CAPTURE', creditHours },
    });

    const token = await this.getAccessToken();
    if (token) {
      try {
        const res = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
              {
                reference_id: dbOrder.id,
                description: `SkillSwap Time Credits (${creditHours} Hours)`,
                amount: {
                  currency_code: 'USD',
                  value: amountUSD.toFixed(2),
                },
              },
            ],
            application_context: {
              brand_name: 'SkillSwap 5.0 Time Banking',
              landing_page: 'NO_PREFERENCE',
              user_action: 'PAY_NOW',
            },
          }),
        });

        if (res.ok) {
          const liveOrder = await res.json();
          dbStore.updateOrder(dbOrder.id, {
            gatewayTransactionId: liveOrder.id,
          });
          return {
            id: liveOrder.id,
            status: liveOrder.status,
            mode: 'live_paypal_v2',
            dbOrderId: dbOrder.id,
          };
        }
      } catch (err: any) {
        console.warn('PayPal live API call failed, using sandbox simulator:', err.message);
      }
    }

    return {
      id: orderId,
      status: 'CREATED',
      mode: 'sandbox_simulator',
      dbOrderId: dbOrder.id,
      amountUSD,
      creditHours,
    };
  }

  public async captureOrder(orderId: string, userId: string) {
    const orders = dbStore.getAllOrders();
    const order = orders.find(
      o => o.gatewayTransactionId === orderId || o.id === orderId
    );

    if (!order) {
      throw new Error(`PayPal Order ${orderId} not found`);
    }

    if (order.status === 'completed') {
      return { success: true, order, message: 'Order already captured' };
    }

    const captureId = `CAP_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Mark as completed
    const updatedOrder = dbStore.updateOrder(order.id, {
      status: 'completed',
      gatewayReceipt: captureId,
    });

    // Credit User Wallet
    const user = dbStore.getUser(order.userId || userId);
    if (user) {
      const newBalance = user.timeCredits + order.creditHours;
      dbStore.updateUser(user.id, { timeCredits: newBalance });
      dbStore.addTransaction({
        userId: user.id,
        type: 'purchase',
        amount: order.creditHours,
        balanceAfter: newBalance,
        description: `PayPal v2 checkout (${captureId}) - Added ${order.creditHours} Time Credits`,
        referenceId: captureId,
      });

      notificationService.onCreditsPurchased(
        user.id,
        order.creditHours,
        'PayPal',
        `$${order.amountUSD.toFixed(2)}`,
        captureId
      );
    }

    return {
      success: true,
      captureId,
      order: updatedOrder,
      creditsAdded: order.creditHours,
    };
  }
}

export const paypalService = new PaypalService();
