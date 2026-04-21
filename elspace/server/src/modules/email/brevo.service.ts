// server/src/modules/email/brevo.service.ts
import axios from 'axios';

const BREVO_API_BASE = 'https://api.brevo.com/v3';

interface SendEmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface BulkEmailOptions extends SendEmailOptions {
  recipientVariables?: Record<string, any>[];
  templateId?: number;
}

export class BrevoEmailService {
  private apiKey: string;
  private senderEmail: string;
  private senderName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@elspace.io';
    this.senderName = process.env.BREVO_SENDER_NAME || 'EL SPACE';

    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }
  }

  private getHeaders() {
    return {
      'api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Send transactional email
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: any }> {
    try {
      const payload = {
        sender: {
          email: this.senderEmail,
          name: this.senderName,
        },
        to: options.to.map(email => ({ email })),
        cc: options.cc?.map(email => ({ email })),
        bcc: options.bcc?.map(email => ({ email })),
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        replyTo: options.replyTo ? { email: options.replyTo } : undefined,
      };

      const response = await axios.post(
        `${BREVO_API_BASE}/smtp/email`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        messageId: response.data.messageId,
      };
    } catch (error: any) {
      console.error('Brevo email send error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Send bulk email for marketing
   */
  async sendBulkEmail(options: BulkEmailOptions): Promise<{ success: boolean; campaignId?: string; error?: any }> {
    try {
      const payload = {
        sender: {
          email: this.senderEmail,
          name: this.senderName,
        },
        to: options.to.map(email => ({ email })),
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        params: options.recipientVariables?.[0] || {},
      };

      const response = await axios.post(
        `${BREVO_API_BASE}/smtp/email`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        campaignId: response.data.messageId,
      };
    } catch (error: any) {
      console.error('Brevo bulk email error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(days: number = 30): Promise<any> {
    try {
      const response = await axios.get(
        `${BREVO_API_BASE}/smtp/statistics?startDate=${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Brevo stats error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Create email template
   */
  async createTemplate(name: string, subject: string, htmlContent: string): Promise<any> {
    try {
      const response = await axios.post(
        `${BREVO_API_BASE}/smtp/templates`,
        {
          name,
          subject,
          htmlContent,
          isActive: true,
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Brevo template creation error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Send template-based email
   */
  async sendTemplateEmail(
    templateId: number,
    recipients: Array<{ email: string; name?: string }>,
    params?: Record<string, any>
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    try {
      const payload = {
        to: recipients.map(r => ({
          email: r.email,
          name: r.name || r.email,
        })),
        templateId,
        params: params || {},
      };

      const response = await axios.post(
        `${BREVO_API_BASE}/smtp/email`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        messageId: response.data.messageId,
      };
    } catch (error: any) {
      console.error('Brevo template email error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }
}

// Export singleton instance
export const brevoService = new BrevoEmailService();
