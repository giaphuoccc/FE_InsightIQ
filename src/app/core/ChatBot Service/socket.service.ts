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
  
    const finalBotResponse: ChatMessage = this.generateMockBotResponse(userMessageText);
  
    switch (finalBotResponse.type) {
      case 'text':
        this.streamTextResponse(finalBotResponse);
        break;
      case 'productComparison':
        this.streamProductComparisonResponse(finalBotResponse);
        break;
      case 'productInfo':
        this.streamProductInfoResponse(finalBotResponse);
        break;
      case 'productPromotion':    // Gọi hàm stream khuyến mãi
        this.streamProductPromotionResponse(finalBotResponse);
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
    const speed = 80;

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

/** Stream so sánh: typing rồi “lật” thành bảng — chỉ 1 tin nhắn */
private streamProductComparisonResponse(finalResponse: ChatMessage): void {
  /* --- unpack --- */
  const { intro, products, conclusion } = finalResponse.content as {
    intro: string;
    products: any[];
    conclusion: string;
  };

  /* --- xây chuỗi để gõ --- */
  const toLines = (p: any) => {
    const spec = p.specifications.map((s: any) => `- ${s.label}: ${s.value}`).join('\n');
    return `\n\n${p.name.toUpperCase()}  (Giá: ${p.price.toLocaleString()}₫)\n${p.shortDescription}\n${spec}`;
  };
  const fullText = `${intro}\n${products.map(toLines).join('')}\n\n${conclusion}`;

  /* --- ID duy nhất cho cả quá trình --- */
  const id = finalResponse.id ?? this.generateId();

  /* --- 1. gửi placeholder --- */
  const typingMsg: ChatMessage = {
    id,
    sender: 'bot',
    type: 'text',
    content: '...',
    timestamp: new Date()
  };
  this.messageSubject.next(typingMsg);

  /* --- 2. gõ ký tự --- */
  let rendered = '';
  let idx = 0;
  const speed = 10;
  this.streamingIntervalId = setTimeout(() => {
    this.streamingIntervalId = setInterval(() => {
      this.ngZone.run(() => {
        if (idx < fullText.length) {
          rendered += fullText[idx++];
          this.messageSubject.next({ ...typingMsg, content: rendered });
        } else {
          this.cancelStreaming();          // dừng gõ
          sendFinalObject();               // lật sang bảng
        }
      });
    }, speed);
  }, 200);

  
  
  /* --- 3. thay thế bằng bảng so sánh (cùng id) --- */
  const sendFinalObject = () => {
    const compMsg: ChatMessage = {
      ...finalResponse,
      id,                                // GIỮ CÙNG ID!
      timestamp: new Date()
    };
    this.messageSubject.next(compMsg);
  };
}

/* ---------------------- 1️⃣ STREAM 1-PRODUCT ---------------------- */
private streamProductInfoResponse(finalResponse: ChatMessage): void {
  /* --- chuẩn bị nội dung để gõ --- */
  const p = finalResponse.content as ProductData;
  const specLines =
    p.specifications?.map(s => `- ${s.label}: ${s.value}`).join('\n') ?? '';
  const fullText = `${p.name.toUpperCase()}  (Giá: ${p.price.toLocaleString()}₫)
${p.shortDescription ?? ''}
${specLines}`;

  /* --- dùng chung 1 id suốt quá trình --- */
  const id = finalResponse.id ?? this.generateId();

  /* --- bước 1: placeholder '...' --- */
  const typingMsg: ChatMessage = {
    id,
    sender: 'bot',
    type: 'text',
    content: '...',
    timestamp: new Date()
  };
  this.messageSubject.next(typingMsg);

  /* --- bước 2: gõ từng ký tự --- */
  let rendered = '';
  let idx = 0;
  const speed = 15;                          // chậm hơn xíu vì chuỗi ngắn
  this.streamingIntervalId = setTimeout(() => {
    this.streamingIntervalId = setInterval(() => {
      this.ngZone.run(() => {
        if (idx < fullText.length) {
          rendered += fullText[idx++];
          this.messageSubject.next({ ...typingMsg, content: rendered });
        } else {
          this.cancelStreaming();            // ngừng gõ
          sendFinalObject();                 // lật sang component
        }
      });
    }, speed);
  }, 200);

  /* --- bước 3: thay bằng object productInfo --- */
  const sendFinalObject = () => {
    const infoMsg: ChatMessage = {
      ...finalResponse,
      id,                                    // GIỮ CÙNG ID!
      timestamp: new Date()
    };
    this.messageSubject.next(infoMsg);
  };
}

/** Stream khuyến mãi: typing rồi “lật” thành bảng — chỉ 1 tin nhắn */
private streamProductPromotionResponse(finalResponse: ChatMessage): void {
  /* --- unpack --- */
  const { productName, promotionDescription, validUntil } = finalResponse.content as ProductPromotionData;

  /* --- xây chuỗi để gõ --- */
  const fullText = `
🎁 Khuyến mãi cho sản phẩm: ${productName}

Mô tả khuyến mãi: ${promotionDescription}

Áp dụng đến: ${validUntil ? validUntil : 'Không có thông tin'}
`;

  /* --- ID duy nhất cho cả quá trình --- */
  const id = finalResponse.id ?? this.generateId();

  /* --- 1. gửi placeholder --- */
  const typingMsg: ChatMessage = {
    id,
    sender: 'bot',
    type: 'text',
    content: '...',
    timestamp: new Date()
  };
  this.messageSubject.next(typingMsg);

  /* --- 2. gõ ký tự --- */
  let rendered = '';
  let idx = 0;
  const speed = 10; // tốc độ gõ ký tự
  this.streamingIntervalId = setTimeout(() => {
    this.streamingIntervalId = setInterval(() => {
      this.ngZone.run(() => {
        if (idx < fullText.length) {
          rendered += fullText[idx++];
          this.messageSubject.next({ ...typingMsg, content: rendered });
        } else {
          this.cancelStreaming();          // dừng gõ
          sendFinalObject();               // lật sang bảng
        }
      });
    }, speed);
  }, 200);

  /* --- 3. thay thế bằng bảng khuyến mãi (cùng id) --- */
  const sendFinalObject = () => {
    const promoMsg: ChatMessage = {
      ...finalResponse,
      id,                                // GIỮ CÙNG ID!
      timestamp: new Date()
    };
    this.messageSubject.next(promoMsg);
  };
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
    comment: 'Galaxy S24 là một sự nâng cấp vượt trội so với các mẫu trước đó, đặc biệt với cải tiến về hiệu năng và camera.',
    intro: 'Samsung Galaxy S24 là một thiết bị rất đẹp và lung linh, mang đến nhiều tính năng vượt trội cho người sử dụng.',
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

    // /* --- KHUYẾN MÃI --- */
    // if (lower.includes('khuyến mãi') && lower.includes('s23')) {
    //   const promoData: ProductPromotionData = {
    //     productName: 'Samsung Galaxy S23',
    //     promotionDescription:
    //       'Giảm trực tiếp 2 000 000 VNĐ + trả góp 0 % + tặng ốp lưng Samsung chính hãng.',
    //     discountedPrice: 14_990_000,
    //     validUntil: `30/${now.getMonth() + 1}/${now.getFullYear()}`
    //   };

    //   return {
    //     id,
    //     sender: 'bot',
    //     type: 'productPromotion',
    //     content: promoData,
    //     timestamp: now
    //   };
    // }

   /* --- KHUYẾN MÃI --- */
if (lower.includes('khuyến mãi') && lower.includes('s24')) {
  const promoData: ProductPromotionData = {
    productName: 'Samsung Galaxy S24',
    promotionDescription:
      'Giảm trực tiếp 1 000 000 VNĐ qua VNPAY + thu cũ đổi mới + tặng Samsung Care+ 1 năm.',
    originalPrice: 22_990_000,  // Giá gốc
    discountedPrice: 21_990_000,  // Giá ưu đãi sau khuyến mãi
    discountPercentage: 4.35,  // Phần trăm giảm giá
    gift: 'Tặng Samsung Care+ 1 năm',  // Quà tặng
    validUntil: `30/${now.getMonth() + 1}/${now.getFullYear()}`,  // Ngày hết hạn của khuyến mãi
    conditions: 'Áp dụng cho tất cả khách hàng mua Samsung Galaxy S24 qua VNPAY.', // Điều kiện khuyến mãi
    productImageUrl: 'path/to/image/s24-image.jpg',  // Ảnh sản phẩm (nếu có)
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
