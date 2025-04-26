/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from '../../components/widget-user/widget-user.component';
import { ProductData } from '../../components/widget-user/product-info/product-info.component';
import { ProductPromotionData } from '../../components/widget-user/product-promotion/product-promotion.component';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private messageSubject = new Subject<ChatMessage>();
  private streamingIntervalId: any = null;

  constructor(private ngZone: NgZone) {}

  /* ------------------------------ SOCKET MOCK ------------------------------ */
  connect(): void {
    console.log('[MOCK] SocketService: connect() called');
  }

  disconnect(): void {
    console.log('[MOCK] SocketService: disconnect() called');
    this.cancelStreaming();
  }

  /* -------------------------- USER → BOT MESSAGE --------------------------- */
  sendMessage(data: any): void {
    const userMessageText: string = data.text;
    this.cancelStreaming();

    const finalBotResponse: ChatMessage = this.generateMockBotResponse(
      userMessageText
    );

    switch (finalBotResponse.type) {
      case 'text':
        this.streamTextResponse(finalBotResponse);
        break;
      case 'productComparison':
        this.streamProductComparisonResponse(finalBotResponse);
        break;
      case 'productInfo':
      case 'productPromotion':
        this.showThinkingThenSend(finalBotResponse);
        break;
      default:
        this.streamTextResponse(finalBotResponse);
    }
  }

  /* --------------------------- STREAMING HELPERS --------------------------- */
  private showThinkingThenSend(msg: ChatMessage): void {
    const thinkingMsg: ChatMessage = {
      id: msg.id ?? this.generateId(),
      sender: 'bot',
      type: 'text',
      content: '...',
      timestamp: new Date()
    };
    this.messageSubject.next(thinkingMsg);

    this.streamingIntervalId = setTimeout(() => {
      this.ngZone.run(() => {
        this.messageSubject.next(msg);
        this.streamingIntervalId = null;
      });
    }, 800);
  }

  listenForMessages(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  private streamTextResponse(finalResponse: ChatMessage): void {
    const fullContent = finalResponse.content as string;
    let rendered = '';
    const id = finalResponse.id ?? this.generateId();
    let idx = 0;
    const speed = 30;

    this.messageSubject.next({ ...finalResponse, content: '...', id });

    this.streamingIntervalId = setTimeout(() => {
      this.streamingIntervalId = setInterval(() => {
        this.ngZone.run(() => {
          if (idx < fullContent.length) {
            rendered += fullContent[idx++];
            this.messageSubject.next({
              ...finalResponse,
              content: rendered,
              id
            });
          } else {
            this.cancelStreaming();
          }
        });
      }, speed);
    }, 200);
  }

  private streamProductComparisonResponse(finalResponse: ChatMessage): void {
    const { intro, products, conclusion } = finalResponse.content as {
      intro: string;
      products: any[];
      conclusion: string;
    };

    const id = finalResponse.id ?? this.generateId();
    let currentIntro = '';
    let idx = 0;
    const speed = 30;

    this.messageSubject.next({ ...finalResponse, content: '...', id });

    const typeIntro = () => {
      this.streamingIntervalId = setInterval(() => {
        this.ngZone.run(() => {
          if (idx < intro.length) {
            currentIntro += intro.charAt(idx++);
            this.messageSubject.next({
              ...finalResponse,
              content: currentIntro,
              id
            });
          } else {
            this.cancelStreaming();
            setTimeout(() => {
              this.ngZone.run(() => {
                this.messageSubject.next({
                  ...finalResponse,
                  content: { intro, products, conclusion },
                  id
                });
              });
            }, 200);
          }
        });
      }, speed);
    };

    setTimeout(typeIntro, 300);
  }

  /* --------------------------- MOCK BOT LOGIC ------------------------------ */
  private generateMockBotResponse(userMessage: string): ChatMessage {
    const lower = userMessage.toLowerCase().trim();
    const now = new Date();
    const id = this.generateId();

    /* --- CHÀO HỎI --- */
    if (/^(xin chào|chào|hello)/.test(lower)) {
      return {
        id,
        sender: 'bot',
        type: 'text',
        content:
          'Xin chào! Tôi có thể giúp gì cho bạn về các sản phẩm Samsung?',
        timestamp: now
      };
    }

    /* --- SO SÁNH S23–S24 --- */
    if (lower.includes('so sánh') && lower.includes('s23') && lower.includes('s24')) {
      return {
        id,
        sender: 'bot',
        type: 'productComparison',
        content: {
          intro: 'So sánh giữa Samsung Galaxy S23 và S24:',
          products: [
            {
              name: 'Samsung Galaxy S23',
              sku: 'SGS23-001',
              category: 'Smartphone',
              shortDescription:
                'Màn hình Dynamic AMOLED 2X, chip Snapdragon 8 Gen 2, camera 50 MP.',
              specifications: [
                { label: 'Màn hình', value: '6.1″ FHD+ 120 Hz' },
                { label: 'Chip', value: 'Snapdragon 8 Gen 2 for Galaxy' },
                { label: 'Pin', value: '3 900 mAh' },
                {
                  label: 'Camera',
                  value: '50 MP + 12 MP + 10 MP'
                }
              ],
              warranty: '12 tháng chính hãng',
              price: 16_990_000,
              promotion: 'Giảm 2 triệu + tặng ốp lưng chính hãng',
              stockStatus: 'Còn hàng',
              policies: {
                return: 'Đổi trả trong 30 ngày',
                shipping: 'Miễn phí giao hàng',
                payment: 'Hỗ trợ trả góp 0 %'
              }
            },
            {
              name: 'Samsung Galaxy S24',
              sku: 'SGS24-001',
              category: 'Smartphone',
              shortDescription:
                'Chip Snapdragon 8 Gen 3, Galaxy AI, màn hình sáng hơn.',
              specifications: [
                { label: 'Màn hình', value: '6.2″ FHD+ 120 Hz' },
                { label: 'Chip', value: 'Snapdragon 8 Gen 3 for Galaxy' },
                { label: 'Pin', value: '4 000 mAh' },
                { label: 'Camera', value: '50 MP (AI nâng cao)' }
              ],
              warranty: '12 tháng chính hãng',
              price: 22_990_000,
              promotion: 'Giảm 1 triệu + Samsung Care+ 1 năm',
              stockStatus: 'Còn hàng',
              policies: {
                return: 'Đổi trả trong 30 ngày',
                shipping: 'Miễn phí giao hàng',
                payment: 'Hỗ trợ trả góp 0 %'
              }
            }
          ],
          conclusion:
            'Galaxy S24 có nhiều cải tiến về hiệu năng, màn hình và camera so với S23.'
        },
        timestamp: now
      };
    }

    /* --- THÔNG TIN TỪNG SẢN PHẨM --- */
    if (lower.includes('s24') && !lower.includes('so sánh') && !lower.includes('khuyến mãi')) {
      const productData: ProductData = {
        name: 'Samsung Galaxy S24',
        sku: 'SGS24-001',
        category: 'Smartphone',
        shortDescription:
          'Flagship 2024 với Snapdragon 8 Gen 3, Galaxy AI, màn hình 6.2″ 120 Hz.',
        specifications: [
          { label: 'Màn hình', value: '6.2″ FHD+ Dynamic AMOLED 2X 120 Hz' },
          { label: 'Chip', value: 'Snapdragon 8 Gen 3 for Galaxy' },
          { label: 'Pin', value: '4 000 mAh, sạc nhanh 45 W' },
          { label: 'Camera', value: '50 MP + 12 MP + 10 MP' }
        ],
        warranty: '12 tháng chính hãng',
        price: 22_990_000,
        promotion: 'Giảm 1 triệu + Samsung Care+ 1 năm',
        stockStatus: 'Còn hàng',
        policies: {
          return: 'Đổi trả trong 30 ngày',
          shipping: 'Miễn phí giao hàng',
          payment: 'Hỗ trợ trả góp 0 %'
        }
      };

      return {
        id,
        sender: 'bot',
        type: 'productInfo',
        content: productData,
        timestamp: now
      };
    }

    if (lower.includes('s23') && !lower.includes('so sánh') && !lower.includes('khuyến mãi')) {
      const productData: ProductData = {
        name: 'Samsung Galaxy S23',
        sku: 'SGS23-001',
        category: 'Smartphone',
        shortDescription:
          'Flagship 2023 nhỏ gọn, Snapdragon 8 Gen 2, camera 50 MP.',
        specifications: [
          { label: 'Màn hình', value: '6.1″ FHD+ Dynamic AMOLED 2X 120 Hz' },
          { label: 'Chip', value: 'Snapdragon 8 Gen 2 for Galaxy' },
          { label: 'Pin', value: '3 900 mAh, sạc nhanh 25 W' },
          { label: 'Camera', value: '50 MP + 12 MP + 10 MP' }
        ],
        warranty: '12 tháng chính hãng',
        price: 16_990_000,
        promotion: 'Giảm 2 triệu + ốp lưng chính hãng',
        stockStatus: 'Còn hàng',
        policies: {
          return: 'Đổi trả trong 30 ngày',
          shipping: 'Miễn phí giao hàng',
          payment: 'Hỗ trợ trả góp 0 %'
        }
      };

      return {
        id,
        sender: 'bot',
        type: 'productInfo',
        content: productData,
        timestamp: now
      };
    }

    /* --- KHUYẾN MÃI --- */
    if (lower.includes('khuyến mãi') && lower.includes('s23')) {
      const promoData: ProductPromotionData = {
        productName: 'Samsung Galaxy S23',
        promotionDescription:
          'Giảm trực tiếp 2 000 000 VNĐ + trả góp 0 % + tặng ốp lưng Samsung chính hãng.',
        discountedPrice: 14_990_000,
        validUntil: `30/${now.getMonth() + 1}/${now.getFullYear()}`
      };

      return {
        id,
        sender: 'bot',
        type: 'productPromotion',
        content: promoData,
        timestamp: now
      };
    }

    if (lower.includes('khuyến mãi') && lower.includes('s24')) {
      const promoData: ProductPromotionData = {
        productName: 'Samsung Galaxy S24',
        promotionDescription:
          'Giảm trực tiếp 1 000 000 VNĐ qua VNPAY + thu cũ đổi mới + tặng Samsung Care+ 1 năm.',
        discountedPrice: 21_990_000,
        validUntil: `30/${now.getMonth() + 1}/${now.getFullYear()}`
      };

      return {
        id,
        sender: 'bot',
        type: 'productPromotion',
        content: promoData,
        timestamp: now
      };
    }

    if (lower.includes('khuyến mãi')) {
      const promoData: ProductPromotionData = {
        productName: 'Các dòng Galaxy',
        promotionDescription:
          'Giảm giá trực tiếp, trả góp 0 %, tặng Galaxy Buds/Watch cho một số model.',
        validUntil: `30/${now.getMonth() + 1}/${now.getFullYear()}`
      };

      return {
        id,
        sender: 'bot',
        type: 'productPromotion',
        content: promoData,
        timestamp: now
      };
    }

    /* --- MẶC ĐỊNH --- */
    return {
      id,
      sender: 'bot',
      type: 'text',
      content: `Xin lỗi, tôi chưa hiểu “${userMessage}”. Bạn có thể hỏi về thông tin, so sánh hoặc khuyến mãi của Galaxy S23/S24 nhé?`,
      timestamp: now
    };
  }

  /* ------------------------------ UTILITY ------------------------------ */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private cancelStreaming(): void {
    if (this.streamingIntervalId) {
      clearInterval(this.streamingIntervalId);
      clearTimeout(this.streamingIntervalId);
      this.streamingIntervalId = null;
    }
  }

  /** Cho phép component dừng luồng stream hiện tại */
  public cancelCurrentStream(): void {
    this.cancelStreaming();
  }
}
