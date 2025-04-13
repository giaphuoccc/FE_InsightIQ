// --- Định nghĩa interface cho tin nhắn ---
import { ProductPromotionData } from './product-promotion/product-promotion.component'; // Đảm bảo import này đúng đường dẫn

export interface ChatMessage {
  sender: 'user' | 'bot';
  type: 'text' | 'productInfo' | 'productComparison' | 'productPromotion';
  content: any;
  timestamp: Date;
  id?: string;
}

// --- Component chính của chatbot ---
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnInit,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductInfoComponent } from './product-info/product-info.component';         // Đảm bảo import đúng
import { ProductComparisonComponent } from './product-comparison/product-comparison.component'; // Đảm bảo import đúng
import { ProductPromotionComponent } from './product-promotion/product-promotion.component';     // Đảm bảo import đúng

@Component({
  selector: 'chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductInfoComponent,
    ProductComparisonComponent,
    ProductPromotionComponent
  ],
  templateUrl: './widget-user.component.html',   // Đảm bảo tên file đúng
  styleUrls: ['./widget-user.component.css']     // Đảm bảo tên file đúng
})
export class WidgetUserComponent implements OnInit, AfterViewInit {
  showChatbox = false;
  isChatting = false;
  messageText: string = '';
  messages: ChatMessage[] = [];
  isBotResponding: boolean = false; // Biến trạng thái mới
  botResponseTimeoutId: any = null; // Lưu ID của setTimeout

  @ViewChild('chatBox') chatBoxRef!: ElementRef;


  constructor(
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Khởi tạo tin nhắn chào mừng ban đầu
    this.messages = [
      {
        id: this.generateId(),
        sender: 'bot',
        type: 'text',
        content: 'Xin chào! Bạn muốn hỏi về sản phẩm nào ạ?',
        timestamp: new Date()
      }
    ];
  }

  ngAfterViewInit(): void {
    // Nếu người dùng đã bấm START CHAT (isChatting = true) mà chatbox đang mở,
    // thì scroll xuống cuối ngay sau khi view sẵn sàng
    if (this.isChatting && this.showChatbox) {
      this.scrollToBottomIfNeeded();
    }
  }

  toggleChatbox(): void {
    this.showChatbox = !this.showChatbox;
    // Nếu mở lại chatbox trong lúc đang chat, thì scroll xuống cuối
    if (this.showChatbox && this.isChatting) {
      this.scrollToBottomIfNeeded();
    }
  }

  startChat(): void {
    this.isChatting = true;
    // Đợi 1 "tick" để giao diện mở chatbox, rồi cuộn xuống
    setTimeout(() => this.scrollToBottomIfNeeded(), 0);
  }

  autoExpand(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Ngăn việc xuống dòng
      this.onSendMessage();
    }
  }

  onSendMessage(): void {
    const text = this.messageText.trim();
    if (text) {
      // Tạo tin nhắn user
      const userMessage: ChatMessage = {
        id: this.generateId(),
        sender: 'user',
        type: 'text',
        content: text,
        timestamp: new Date()
      };
      // Thêm tin nhắn người dùng vào mảng
      this.messages.push(userMessage);
      // Xoá input sau khi gửi
      this.messageText = '';

      // Reset chiều cao textarea
      const textarea = document.querySelector('.message-input .chat-input') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = '40px';
      }

      // Đánh dấu là bot đang phản hồi
      this.isBotResponding = true;
      this.cdRef.detectChanges(); // Yêu cầu Angular cập nhật DOM ngay lập tức
      // Cuộn xuống hiển thị tin nhắn vừa gửi
      this.scrollToBottomIfNeeded();

      // Giả lập lấy phản hồi từ bot
      this.getMockBotResponse(text);
    }
  }

  getMockBotResponse(userMessage: string): void {
    let botResponse: ChatMessage;
    const lower = userMessage.toLowerCase();

    // --- Logic xác định nội dung botResponse ---
    if (lower.includes('so sánh') && lower.includes('s23') && lower.includes('s24')) {
      botResponse = {
        id: this.generateId(),
        sender: 'bot',
        type: 'productComparison',
        content: {
          intro: 'So sánh giữa Samsung Galaxy S23 và S24:',
          products: [
            {
              name: 'Samsung Galaxy S23',
              sku: 'SGS23-001',
              category: 'Điện thoại',
              shortDescription: 'Màn hình Dynamic AMOLED 2X, chip Snapdragon mạnh mẽ, camera 50MP.',
              specifications: [
                { label: 'Kích thước', value: '146.3 x 70.9 x 7.6 mm' },
                { label: 'Trọng lượng', value: '168 g' },
                { label: 'Màu sắc', value: 'Phantom Black, Cream, Green' },
                { label: 'Chất liệu', value: 'Kính Gorilla Glass Victus 2' }
              ],
              warranty: '12 tháng',
              price: 18990000,
              promotion: 'Giảm 10%, tặng tai nghe không dây trị giá 1,200,000 VND',
              stockStatus: 'Còn hàng',
              policies: {
                return: 'Đổi trả trong 7 ngày nếu sản phẩm lỗi do nhà sản xuất.',
                shipping: 'Giao hàng toàn quốc, miễn phí đơn từ 500k. Thời gian 1–3 ngày.',
                payment: 'Thanh toán khi nhận hàng (COD), chuyển khoản, ví điện tử.'
              }
            },
            {
              name: 'Samsung Galaxy S24',
              sku: 'SGS24-001',
              category: 'Điện thoại',
              shortDescription: 'Cấu hình mạnh mẽ hơn với Snapdragon 8 Gen 3, camera nâng cấp, màn hình sáng hơn.',
              specifications: [
                { label: 'Kích thước', value: '147.0 x 70.6 x 7.6 mm' },
                { label: 'Trọng lượng', value: '167 g' },
                { label: 'Màu sắc', value: 'Onyx Black, Marble Grey, Cobalt Violet' },
                { label: 'Chất liệu', value: 'Kính Gorilla Armor + khung nhôm' }
              ],
              warranty: '12 tháng',
              price: 21990000,
              promotion: 'Tặng bao da chính hãng và giảm thêm 500.000 VND khi thanh toán qua VNPay',
              stockStatus: 'Còn hàng',
              policies: {
                return: 'Đổi trả trong 7 ngày nếu sản phẩm lỗi do nhà sản xuất.',
                shipping: 'Giao hàng miễn phí toàn quốc trong 1–3 ngày.',
                payment: 'COD, chuyển khoản, ví điện tử.'
              }
            }
          ],
          conclusion: 'Galaxy S24 có nhiều cải tiến hơn về hiệu năng, màn hình và camera.'
        },
        timestamp: new Date()
      };
    } else if ((lower.includes('khuyến mãi') || lower.includes('giảm giá') || lower.includes('ưu đãi')) && lower.includes('s23')) {
      botResponse = {
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
        timestamp: new Date()
      };
    } else if ((lower.includes('khuyến mãi') || lower.includes('giảm giá') || lower.includes('ưu đãi')) && lower.includes('s24')) {
      botResponse = {
        id: this.generateId(),
        sender: 'bot',
        type: 'productPromotion',
        content: {
          productName: 'Samsung Galaxy S24',
          promotionDescription: 'Mua S24 nhận ngay quà tặng hấp dẫn!',
          gift: 'Bao da chính hãng + Giảm thêm 500.000 VND khi thanh toán qua VNPay',
          validUntil: new Date(2025, 4, 31), // Lưu ý: tháng 4 = Tháng 5 (JS Date 0-indexed)
          conditions: 'Số lượng có hạn.'
        } as ProductPromotionData,
        timestamp: new Date()
      };
    } else if (
      lower.includes('samsung') && lower.includes('s23') &&
      !lower.includes('so sánh') && !lower.includes('khuyến mãi') &&
      !lower.includes('giảm giá') && !lower.includes('ưu đãi')
    ) {
      botResponse = {
        id: this.generateId(),
        sender: 'bot',
        type: 'productInfo',
        content: {
          name: 'Điện thoại Samsung Galaxy S23',
          sku: 'SGS23-001',
          category: 'Điện thoại',
          shortDescription: 'Màn hình Dynamic AMOLED 2X, chip Snapdragon mạnh mẽ, camera 50MP.',
          specifications: [
            { label: 'Kích thước', value: '146.3 x 70.9 x 7.6 mm' },
            { label: 'Trọng lượng', value: '168 g' },
            { label: 'Màu sắc', value: 'Phantom Black, Cream, Green' },
            { label: 'Chất liệu', value: 'Kính Gorilla Glass Victus 2' }
          ],
          warranty: '12 tháng',
          price: 18990000,
          promotion: 'Giảm 10%, tặng tai nghe không dây trị giá 1,200,000 VND',
          stockStatus: 'Còn hàng',
          policies: {
            return: 'Đổi trả trong 7 ngày nếu sản phẩm lỗi do nhà sản xuất.',
            shipping: 'Giao hàng toàn quốc, miễn phí đơn từ 500k. Thời gian 1–3 ngày.',
            payment: 'Thanh toán khi nhận hàng (COD), chuyển khoản, ví điện tử.'
          },
          imageUrl: ''
        },
        timestamp: new Date()
      };
    } else {
      // Phản hồi mặc định nếu không khớp điều kiện trên
      botResponse = {
        id: this.generateId(),
        sender: 'bot',
        type: 'text',
        content: `Xin lỗi, tôi chưa hiểu rõ yêu cầu về "${userMessage}". Bạn có thể thử hỏi "so sánh S23 và S24", "thông tin Samsung S23" hoặc "khuyến mãi S24"?`,
        timestamp: new Date()
      };
    }


    // Giả lập bot trả lời sau 0.5 giây
    // Lưu timeout ID để có thể huỷ nếu cần
    this.ngZone.run(() => {
    this.botResponseTimeoutId = setTimeout(() => {
      // Kiểm tra timeout ID có hợp lệ không trước khi thực hiện
      if(!this.botResponseTimeoutId) return;

      // Thêm 1 tin nhắn bot
      this.messages.push(botResponse);
      console.log('Added bot message:', botResponse);

      // Xét trạng thái và timeout ID về null sau khi phản hồi xong
      this.isBotResponding = false;
      this.botResponseTimeoutId = null;

      // Yêu cầu Angular cập nhật DOM
      this.cdRef.detectChanges();
      console.log('Change detection triggered for bot message.');

      // Chờ thêm 1 nhịp để DOM render xong, rồi cuộn xuống
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    }, 5000); // Thay đổi độ trễ ở đây nếu cần
    });
  }

  scrollToBottom(): void {
    if (this.chatBoxRef?.nativeElement) {
      try {
        const element = this.chatBoxRef.nativeElement;
        element.scrollTop = element.scrollHeight;
      } catch (err) {
        console.error('Could not scroll to bottom:', err);
      }
    }
  }

  scrollToBottomIfNeeded(): void {
    // Đẩy việc cuộn xuống cuối hàng đợi, đảm bảo DOM đã render xong
    this.ngZone.run(() => {
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    });
  }

  generateId(): string {
    // Hàm tạo ID đơn giản
    return Math.random().toString(36).substring(2, 15);
  }
  stopBotResponse(): void{
    if(this.botResponseTimeoutId){
      clearTimeout(this.botResponseTimeoutId);
      this.botResponseTimeoutId = null; // Xóa id đã lưu
      this.isBotResponding = false; // Reset trạng thái chatbot đang phản hồi về false
      this.cdRef.detectChanges(); // Yêu cầu Angular cập nhật giao diện ngay
    }
  }

  // Phương thức xử lý xóa đoạn chat
  clearChat(): void{
    console.log('Clear chat button clicked!'); // Log để kiểm tra

    // Ngừng phản hồi chatbot nếu nó đang trả lời
    this.stopBotResponse();

    // Ghi đè lại mảng tin nhắn bằng cách gán giá trị mới cho biến message
    this.messages = [
      {
        id: this.generateId(), // Tạo id mới
        sender: 'bot',
        type: 'text',
        content: 'Xin chào! Bạn muốn hỏi về sản phẩm nào ạ?',
        timestamp: new Date() // Lấy thời gian hiện tại
      }
    ];

    // Thông báo cho Angular biết để lấy dữ liệu cập nhật theo giao diện
    this.cdRef.detectChanges();

    // Cuộn xuống dưới cùng khung chat
    this.ngZone.runOutsideAngular(()=>{
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    })
  }
}
