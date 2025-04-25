import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from '../../components/widget-user/widget-user.component';
import { ProductPromotionData } from '../../components/widget-user/product-promotion/product-promotion.component';
import { ProductData } from '../../components/widget-user/product-info/product-info.component';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private messageSubject = new Subject<ChatMessage>();
  private streamingIntervalId: any = null;

  constructor(private ngZone: NgZone) {}

  connect(): void {
    console.log('[MOCK] SocketService: connect() called');
  }

  disconnect(): void {
    console.log('[MOCK] SocketService: disconnect() called');
    this.cancelStreaming();
  }

  sendMessage(data: any): void {
    const userMessageText = data.text;
    this.cancelStreaming();

    const finalBotResponse = this.generateMockBotResponse(userMessageText);

    if (finalBotResponse.type === 'text') {
      this.streamTextResponse(finalBotResponse);
    } else {
      const thinkingMessage: ChatMessage = {
        id: this.generateId(),
        sender: 'bot',
        type: 'text',
        content: '...',
        timestamp: new Date()
      };
      this.messageSubject.next(thinkingMessage);

      this.streamingIntervalId = setTimeout(() => {
        this.ngZone.run(() => {
          this.messageSubject.next(finalBotResponse);
          this.streamingIntervalId = null;
        });
      }, 1200);
    }
  }

  private streamTextResponse(finalResponse: ChatMessage): void {
    const fullContent = finalResponse.content as string;
    let currentContent = '';
    const messageId = finalResponse.id ?? this.generateId();
    let charIndex = 0;
    const typingSpeed = 30;

    const initialMessage: ChatMessage = {
      ...finalResponse,
      id: messageId,
      content: '...'
    };
    this.messageSubject.next(initialMessage);

    this.streamingIntervalId = setInterval(() => {
      this.ngZone.run(() => {
        if (charIndex < fullContent.length) {
          currentContent += fullContent.charAt(charIndex);
          charIndex++;
          const updatedMessage: ChatMessage = {
            ...finalResponse,
            id: messageId,
            content: currentContent
          };
          this.messageSubject.next(updatedMessage);
        } else {
          this.cancelStreaming();
        }
      });
    }, typingSpeed);
  }

  listenForMessages(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  private generateMockBotResponse(userMessage: string): ChatMessage {
    const lower = userMessage.toLowerCase();
    const now = new Date();

    if (lower.includes('so sánh') && lower.includes('s23') && lower.includes('s24')) {
      return {
        id: this.generateId(),
        sender: 'bot',
        type: 'productComparison',
        content: {
          intro: 'So sánh giữa Samsung Galaxy S23 và S24:',
          products: [/* ... giữ nguyên chi tiết sản phẩm ... */],
          conclusion: 'Galaxy S24 có nhiều cải tiến hơn về hiệu năng, màn hình và camera.'
        },
        timestamp: now
      };
    } else if ((lower.includes('khuyến mãi') || lower.includes('giảm giá') || lower.includes('ưu đãi')) && lower.includes('s23')) {
      return {
        id: this.generateId(),
        sender: 'bot',
        type: 'productPromotion',
        content: {
          productName: 'Samsung Galaxy S23',
          promotionDescription: 'Ưu đãi đặc biệt khi mua S23!',
          originalPrice: 18990000,
          discountedPrice: 17091000,
          discountPercentage: 10,
          gift: 'Tai nghe không dây trị giá 1,200,000 VND',
          validUntil: '30/04/2025',
          conditions: 'Áp dụng khi mua online và thanh toán trước.'
        } as ProductPromotionData,
        timestamp: now
      };
    } else if (lower.includes('samsung') && lower.includes('s23') && !lower.includes('so sánh') && !lower.includes('khuyến mãi')) {
      return {
        id: this.generateId(),
        sender: 'bot',
        type: 'productInfo',
        content: {
          name: 'Samsung Galaxy S23',
          price: 18990000,
          shortDescription: 'Màn hình Dynamic AMOLED 2X, chip Snapdragon mạnh mẽ, camera 50MP.',
          specifications: [
            { label: 'Kích thước', value: '146.3 x 70.9 x 7.6 mm' },
            { label: 'Trọng lượng', value: '168 g' }
          ]
        } as ProductData,
        timestamp: now
      };
    } else {
      return {
        id: this.generateId(),
        sender: 'bot',
        type: 'text',
        content: `Xin lỗi, tôi chưa hiểu rõ yêu cầu về "${userMessage}".`,
        timestamp: now
      };
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private cancelStreaming(): void {
    if (this.streamingIntervalId) {
      clearInterval(this.streamingIntervalId);
      clearTimeout(this.streamingIntervalId);
      this.streamingIntervalId = null;
      console.log('[MOCK] Streaming cancelled.');
    }
  }

  public cancelCurrentStream(): void {
    this.cancelStreaming();
  }
}
