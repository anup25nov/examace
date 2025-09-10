import QRCode from 'qrcode';

export interface UpiPaymentData {
  upiId: string;
  amount: number;
  transactionNote: string;
  merchantName: string;
  transactionId: string;
}

export interface UpiApp {
  id: string;
  name: string;
  packageName: string;
  urlScheme: string;
  icon: string;
  color: string;
}

export class SimpleUpiService {
  private static instance: SimpleUpiService;
  
  // Your UPI ID - update this with your actual UPI ID
  private readonly UPI_ID = 'ankit.m9155@axl';
  
  // Your business name
  private readonly MERCHANT_NAME = 'ExamAce';

  public static getInstance(): SimpleUpiService {
    if (!SimpleUpiService.instance) {
      SimpleUpiService.instance = new SimpleUpiService();
    }
    return SimpleUpiService.instance;
  }

  /**
   * Generate UPI payment URL
   */
  generateUpiUrl(paymentData: {
    amount: number;
    transactionNote: string;
    transactionId: string;
  }): string {
    const { amount, transactionNote, transactionId } = paymentData;
    
    // Create UPI URL with payment details
    const upiUrl = `upi://pay?pa=${this.UPI_ID}&pn=${this.MERCHANT_NAME}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${transactionId}`;
    
    return upiUrl;
  }

  /**
   * Generate QR code for UPI payment
   */
  async generateQrCode(paymentData: {
    amount: number;
    transactionNote: string;
    transactionId: string;
  }): Promise<string> {
    try {
      const upiUrl = this.generateUpiUrl(paymentData);
      const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Get UPI apps with deep links
   */
  getUpiApps(): UpiApp[] {
    return [
      {
        id: 'phonepe',
        name: 'PhonePe',
        packageName: 'com.phonepe.app',
        urlScheme: 'phonepe://',
        icon: '📱',
        color: '#5F259F'
      },
      {
        id: 'googlepay',
        name: 'Google Pay',
        packageName: 'com.google.android.apps.nbu.paisa.user',
        urlScheme: 'tez://',
        icon: '💳',
        color: '#4285F4'
      },
      {
        id: 'paytm',
        name: 'Paytm',
        packageName: 'net.one97.paytm',
        urlScheme: 'paytmmp://',
        icon: '💰',
        color: '#00BAF2'
      },
      {
        id: 'bhim',
        name: 'BHIM',
        packageName: 'in.org.npci.upiapp',
        urlScheme: 'bhim://',
        icon: '🏦',
        color: '#FF6B35'
      },
      {
        id: 'amazonpay',
        name: 'Amazon Pay',
        packageName: 'in.amazon.mShop.android.shopping',
        urlScheme: 'amazonpay://',
        icon: '🛒',
        color: '#FF9900'
      }
    ];
  }

  /**
   * Generate deep link for specific UPI app
   */
  generateAppDeepLink(app: UpiApp, paymentData: {
    amount: number;
    transactionNote: string;
    transactionId: string;
  }): string {
    const upiUrl = this.generateUpiUrl(paymentData);
    
    switch (app.id) {
      case 'phonepe':
        return `phonepe://pay?pa=${this.UPI_ID}&pn=${this.MERCHANT_NAME}&am=${paymentData.amount}&cu=INR&tn=${encodeURIComponent(paymentData.transactionNote)}&tr=${paymentData.transactionId}`;
      
      case 'googlepay':
        return `tez://upi/pay?pa=${this.UPI_ID}&pn=${this.MERCHANT_NAME}&am=${paymentData.amount}&cu=INR&tn=${encodeURIComponent(paymentData.transactionNote)}&tr=${paymentData.transactionId}`;
      
      case 'paytm':
        return `paytmmp://pay?pa=${this.UPI_ID}&pn=${this.MERCHANT_NAME}&am=${paymentData.amount}&cu=INR&tn=${encodeURIComponent(paymentData.transactionNote)}&tr=${paymentData.transactionId}`;
      
      case 'bhim':
        return `bhim://pay?pa=${this.UPI_ID}&pn=${this.MERCHANT_NAME}&am=${paymentData.amount}&cu=INR&tn=${encodeURIComponent(paymentData.transactionNote)}&tr=${paymentData.transactionId}`;
      
      case 'amazonpay':
        return `amazonpay://pay?pa=${this.UPI_ID}&pn=${this.MERCHANT_NAME}&am=${paymentData.amount}&cu=INR&tn=${encodeURIComponent(paymentData.transactionNote)}&tr=${paymentData.transactionId}`;
      
      default:
        return upiUrl;
    }
  }

  /**
   * Open UPI app with payment details
   */
  openUpiApp(app: UpiApp, paymentData: {
    amount: number;
    transactionNote: string;
    transactionId: string;
  }): void {
    const deepLink = this.generateAppDeepLink(app, paymentData);
    
    // Try to open the app
    const link = document.createElement('a');
    link.href = deepLink;
    link.click();
    
    // Fallback: open generic UPI URL
    setTimeout(() => {
      const fallbackLink = document.createElement('a');
      fallbackLink.href = this.generateUpiUrl(paymentData);
      fallbackLink.click();
    }, 1000);
  }

  /**
   * Validate UPI transaction reference
   */
  validateUpiReference(reference: string): { valid: boolean; error?: string } {
    if (!reference || reference.trim() === '') {
      return { valid: false, error: 'Transaction reference is required' };
    }

    if (reference.length < 8) {
      return { valid: false, error: 'Transaction reference must be at least 8 characters long' };
    }

    if (reference.length > 20) {
      return { valid: false, error: 'Transaction reference must be less than 20 characters' };
    }

    // Check for valid characters (alphanumeric and some special chars)
    if (!/^[A-Za-z0-9_-]+$/.test(reference)) {
      return { valid: false, error: 'Transaction reference contains invalid characters' };
    }

    return { valid: true };
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }

  /**
   * Get UPI ID
   */
  getUpiId(): string {
    return this.UPI_ID;
  }

  /**
   * Get merchant name
   */
  getMerchantName(): string {
    return this.MERCHANT_NAME;
  }

  /**
   * Generate transaction ID
   */
  generateTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}

// Export singleton instance
export const simpleUpiService = SimpleUpiService.getInstance();
