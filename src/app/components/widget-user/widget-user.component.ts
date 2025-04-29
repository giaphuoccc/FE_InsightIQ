import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnInit,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Import các component con và service
import { ProductInfoComponent } from './product-info/product-info.component';
import { ProductComparisonComponent } from './product-comparison/product-comparison.component';
import { ProductPromotionComponent } from './product-promotion/product-promotion.component';
import { SocketService } from '../../core/chatBot/socket.service'; // Đảm bảo đường dẫn đúng

// --- Định nghĩa interface cho tin nhắn ---
export interface ChatMessage {
  id?: string;
  sender: 'user' | 'bot';
  // THÊM 'productComparison' vào đây
  type: 'text' | 'productInfo' | 'productComparison' | 'productPromotion';
  content: any; // Có thể là string hoặc object
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
}

// --- Định nghĩa interface cho dữ liệu sản phẩm (cho productInfo) ---
export interface ProductData {
  intro?: string;
  name?: string;
  category?: string;
  manufacturer?: string;
  shortDescription?: string;
  specifications?: { label: string; value: string }[];
  price?: number;
  priceString?: string;
  promotion?: string;
  stockStatus?: string;
  warranty?: string;
  comment?: string;
  imageUrl?: string;
}

// --- Định nghĩa interface cho dữ liệu SO SÁNH SẢN PHẨM ---
// Phải khớp với @Input() data của ProductComparisonComponent
export interface ProductComparisonData {
  intro: string;
  products: {
    name: string;
    sku: string; // Cần có, dù parser có thể không tìm thấy
    category: string;
    shortDescription: string;
    specifications: { label: string; value: string }[];
    warranty: string; // Cần có
    price: number; // Cần có (hoặc priceString nếu chỉ có text)
    priceString?: string; // Thêm để lưu trữ giá dạng chuỗi nếu cần
    promotion: string; // Cần có
    stockStatus: string; // Cần có
    // Cần có policies, dù parser có thể không tìm thấy
    policies: {
      return: string;
      shipping: string;
      payment: string;
    };
    // Thêm các trường khác nếu backend trả về hoặc bạn muốn hiển thị
    manufacturer?: string; // Thêm nếu muốn parse nhà sản xuất
  }[];
  conclusion: string;
}

const DEFAULT_UPDATE_MSG = 'Đang cập nhật'; // Hằng số cho thông báo mặc định

@Component({
  selector: 'chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductInfoComponent,
    ProductComparisonComponent,
    ProductPromotionComponent,
  ],
  templateUrl: './widget-user.component.html',
  styleUrls: ['./widget-user.component.css'],
})
export class WidgetUserComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- Thuộc tính của Component ---
  showChatbox = false;
  isChatting = false;
  messageText: string = '';
  messages: ChatMessage[] = [];
  isBotResponding: boolean = false;
  private messageSubscription: Subscription | null = null;

  // Thông tin session (VÍ DỤ)
  private currentSessionId: number | undefined = undefined;
  private currentSessionToken: string | undefined = undefined;
  private currentTenantId: number = 1; // LẤY TỪ NGUỒN THỰC TẾ

  @ViewChild('chatBox') chatBoxRef!: ElementRef;

  // --- Constructor ---
  constructor(
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private socketService: SocketService
  ) {
    console.log('>>> WidgetUserComponent CONSTRUCTOR running');
  }

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    console.log('>>> WidgetUserComponent ngOnInit running');
    this.messages = [
      {
        id: this.generateId(),
        sender: 'bot',
        type: 'text',
        content: 'Xin chào! Bạn cần InsightIQ hỗ trợ về sản phẩm nào ạ?',
        timestamp: new Date(),
      },
    ];

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    this.messageSubscription = this.socketService
      .listenForNewMessages()
      .subscribe({
        next: (botMessage: ChatMessage) => {
          console.log(
            '>>> WidgetUserComponent: Received raw message from service',
            botMessage
          );

          let processedContent: any = botMessage.content; // Mặc định

          // *** XỬ LÝ PARSE CHO CÁC LOẠI TIN NHẮN ĐẶC BIỆT ***
          try {
            if (
              botMessage.type === 'productInfo' &&
              typeof botMessage.content === 'string'
            ) {
              processedContent = this.parseProductInfoContent(
                botMessage.content
              );
              console.log(
                '>>> WidgetUserComponent: Parsed Product Info:',
                processedContent
              );
            } else if (
              // === THÊM LOGIC PARSE CHO SO SÁNH SẢN PHẨM ===
              botMessage.type === 'productComparison' &&
              typeof botMessage.content === 'string'
            ) {
              processedContent = this.parseProductComparisonContent(
                botMessage.content
              );
              console.log(
                '>>> WidgetUserComponent: Parsed Product Comparison:',
                processedContent
              );
            }
            // Thêm else if cho các type khác nếu cần parse
          } catch (error) {
            console.error(
              `>>> WidgetUserComponent: Error parsing content for type ${botMessage.type}:`,
              error
            );
            // Xử lý lỗi: Hiển thị thông báo lỗi hoặc giữ content gốc
            processedContent = `Xin lỗi, đã có lỗi xảy ra khi hiển thị nội dung ${
              botMessage.type === 'productInfo'
                ? 'thông tin sản phẩm'
                : botMessage.type === 'productComparison'
                ? 'so sánh sản phẩm'
                : '' // Thêm các loại khác
            }. Nội dung gốc: ${botMessage.content}`;
            // Đổi type thành 'text' để hiển thị như tin nhắn thường
            botMessage.type = 'text';
          }
          // *** KẾT THÚC XỬ LÝ PARSE ***

          const finalMessage: ChatMessage = {
            ...botMessage,
            content: processedContent,
            timestamp: botMessage.timestamp
              ? new Date(botMessage.timestamp)
              : new Date(),
            liked: botMessage.liked ?? false,
            disliked: botMessage.disliked ?? false,
          };

          this.messages.push(finalMessage);
          this.isBotResponding = false;
          this.cdRef.detectChanges();
          this.scrollToBottomIfNeeded();
        },
        error: (err: any) => {
          console.error(
            '>>> WidgetUserComponent: Error receiving message:',
            err
          );
          this.isBotResponding = false;
          this.messages.push({
            id: this.generateId(),
            sender: 'bot',
            type: 'text',
            content:
              'Xin lỗi, đã có lỗi kết nối hoặc xử lý từ máy chủ. Vui lòng thử lại sau.',
            timestamp: new Date(),
          });
          this.cdRef.detectChanges();
          this.scrollToBottomIfNeeded();
        },
      });
  }

  ngAfterViewInit(): void {
    if (this.isChatting && this.showChatbox) {
      this.scrollToBottomIfNeeded();
    }
  }

  ngOnDestroy(): void {
    console.log('>>> WidgetUserComponent ngOnDestroy');
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }
    this.socketService.disconnect();
  }

  // --- Các phương thức xử lý sự kiện và logic khác ---

  toggleChatbox(): void {
    this.showChatbox = !this.showChatbox;
    if (this.showChatbox && this.isChatting) {
      this.scrollToBottomIfNeeded();
    }
  }

  startChat(): void {
    this.isChatting = true;
    console.log('Chat started. Need logic to get/set session info.');
    // Cần logic lấy/tạo session ID/Token thực tế ở đây
    // this.currentSessionId = ...;
    // this.currentSessionToken = ...;
    setTimeout(() => this.scrollToBottomIfNeeded(), 0);
  }

  autoExpand(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  onSendMessage(): void {
    const text = this.messageText.trim();
    if (text && this.socketService) {
      const userMessage: ChatMessage = {
        id: this.generateId(),
        sender: 'user',
        type: 'text',
        content: text,
        timestamp: new Date(),
      };
      this.messages.push(userMessage);
      this.messageText = '';

      // Reset textarea height
      const textarea = document.querySelector(
        '.message-input .chat-input'
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto'; // Hoặc giá trị min-height
      }

      this.isBotResponding = true;
      this.cdRef.detectChanges();
      this.scrollToBottomIfNeeded();

      const tenantIdToSend = this.currentTenantId;
      const sessionIdToSend = this.currentSessionId;
      const sessionTokenToSend = this.currentSessionToken;

      if (typeof tenantIdToSend === 'undefined') {
        console.error(
          '>>> WidgetUserComponent: Tenant ID is missing! Cannot send message.'
        );
        this.isBotResponding = false;
        this.messages.push({
          id: this.generateId(),
          sender: 'bot',
          type: 'text',
          content:
            'Lỗi: Không thể gửi tin nhắn do thiếu thông tin định danh (Tenant ID).',
          timestamp: new Date(),
        });
        this.cdRef.detectChanges();
        this.scrollToBottomIfNeeded();
        return;
      }

      const dataToSend = {
        text: text,
        tenantId: tenantIdToSend,
        sessionId: sessionIdToSend,
        sessionToken: sessionTokenToSend,
      };

      console.log('>>> WidgetUserComponent: Sending message via socket', dataToSend);
      this.socketService.sendMessage(dataToSend);
    }
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
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.scrollToBottom();
        });
      }, 0);
    });
  }

  generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  clearChat(): void {
    this.messages = [
      {
        id: this.generateId(),
        sender: 'bot',
        type: 'text',
        content: 'Chào bạn, InsightIQ có thể giúp gì cho bạn?',
        timestamp: new Date(),
      },
    ];
    // Cân nhắc reset session ID/token
    // this.currentSessionId = undefined;
    // this.currentSessionToken = undefined;
    console.log('Chat cleared.');
    this.cdRef.detectChanges();
    this.scrollToBottomIfNeeded();
  }

  toggleLike(msg: ChatMessage): void {
    if (!msg.id) return;
    msg.liked = !msg.liked;
    if (msg.liked) msg.disliked = false;
    console.log(`Message ${msg.id} Liked: ${msg.liked}`);
    // TODO: Gửi feedback lên server
    // this.socketService.sendFeedback({ messageId: msg.id, reaction: 'like' });
    this.cdRef.detectChanges();
  }

  toggleDislike(msg: ChatMessage): void {
    if (!msg.id) return;
    msg.disliked = !msg.disliked;
    if (msg.disliked) msg.liked = false;
    console.log(`Message ${msg.id} Disliked: ${msg.disliked}`);
    // TODO: Gửi feedback lên server
    // this.socketService.sendFeedback({ messageId: msg.id, reaction: 'dislike' });
    this.cdRef.detectChanges();
  }

  stopBotResponse(): void {
    console.log('>>> WidgetUserComponent: Stop bot response requested by user.');
    // TODO: Implement logic to actually stop the request on the server via SocketService
    // this.socketService.cancelCurrentRequest();
    this.isBotResponding = false;
    this.cdRef.detectChanges();
  }

  // --- HÀM PHÂN TÍCH CHUỖI THÔNG TIN SẢN PHẨM (productInfo) ---
  private parseProductInfoContent(content: string): Partial<ProductData> {
    // (Giữ nguyên hàm parseProductInfoContent của bạn ở đây)
    console.log('--- Starting Product Info Parse ---');
    console.log('Raw content:', content);

    const productData: Partial<ProductData> = { specifications: [] };
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    if (lines.length === 0) {
      console.warn('Parsing empty content.');
      return {};
    }

    let isParsingSpecs = false;
    let potentialName = '';

    const firstDetailIndex = lines.findIndex((line) => line.includes('**:'));
    console.log('First Detail Index:', firstDetailIndex);

    if (firstDetailIndex > 0) {
      productData.intro = lines
        .slice(0, firstDetailIndex)
        .join(' ')
        .replace(/^- /, '')
        .trim();
      console.log('Parsed Intro:', productData.intro);
    } else if (firstDetailIndex === -1) {
        const firstLineLooksLikeIntro = !lines[0].includes(':') && !lines[0].startsWith('- **') && !lines[0].startsWith('**');
        if (firstLineLooksLikeIntro) {
            productData.intro = lines[0].replace(/^- /, '').trim();
            console.log("Parsed Intro (fallback):", productData.intro);
        }
    } else if (firstDetailIndex === 0 && lines[0].toLowerCase().startsWith('chào bạn')) {
         productData.intro = lines[0].split('**:')[0] + '**:' ; // Giữ lại phần chào
         console.log("Parsed Intro (greeting case):", productData.intro);
    }


    lines.forEach((line, index) => {
        console.log(`Processing line ${index}: "${line}"`);
        if (productData.intro && firstDetailIndex > 0 && index < firstDetailIndex) {
            console.log("Skipping line (already part of intro)");
            return;
        }

        if (!productData.name && line.startsWith('**') && line.includes('**:')) {
             potentialName = line.split('**:')[0].replace('**', '').trim();
             console.log("Potential Name found (from key):", potentialName);
        } else if (!productData.name && line.startsWith('**') && line.endsWith('**') && !line.includes(':') && !line.toLowerCase().includes('tính năng') && !line.toLowerCase().includes('thông số')) {
             potentialName = line.replace(/\*\*/g, '').trim();
             console.log("Potential Name found (standalone bold):", potentialName);
        }

        const matchKeyValue = line.match(/^-?\s*\*\*(.*?):\*\*\s*(.*)/);
        const matchListItem = line.match(/^- (.*)/);

        if (matchKeyValue) {
            console.log("Matched Key-Value:", matchKeyValue[1], "=>", matchKeyValue[2]);
            isParsingSpecs = false; // Dừng parse specs khi gặp key-value mới
            const key = matchKeyValue[1].trim().toLowerCase();
            let value = matchKeyValue[2].trim();

             if (!productData.name && potentialName && key === potentialName.toLowerCase()) {
                 productData.name = potentialName;
                 console.log("Confirmed Name:", productData.name);
             } else if (!productData.name && potentialName && value.toLowerCase().includes(potentialName.toLowerCase())) {
                  productData.name = potentialName;
                 console.log("Confirmed Name (from value containing potential name):", productData.name);
             }


            switch (key) {
                case 'danh mục':
                    productData.category = value;
                    break;
                case 'nhà sản xuất':
                    productData.manufacturer = value;
                    break;
                case 'mô tả':
                    productData.shortDescription = value;
                    break;
                case 'mức giá': case 'giá': case 'khoảng giá':
                    productData.priceString = value;
                    const priceMatch = value.match(/(\d[\d,.]*)/);
                    if (priceMatch) {
                        productData.price = parseFloat(priceMatch[1].replace(/,/g, ''));
                        console.log("Parsed Price (number):", productData.price);
                    } else {
                         console.log("Could not parse number from price string:", value);
                    }
                    break;
                case 'bảo hành':
                    productData.warranty = value;
                    break;
                case 'tình trạng': case 'tình trạng hàng':
                    productData.stockStatus = value;
                    break;
                case 'khuyến mãi':
                    productData.promotion = value;
                    break;
                case 'tính năng chính': case 'thông số kỹ thuật':
                    console.log("Starting Specs Parsing...");
                    isParsingSpecs = true;
                    if (value && !productData.specifications?.find(s => s.value === value)) {
                        productData.specifications = productData.specifications || [];
                        productData.specifications.push({ label: 'Mô tả chung', value: value });
                        console.log("Added general spec description:", value);
                    }
                    break;
                default:
                     if (!productData.name && potentialName && key === potentialName.toLowerCase()){
                         productData.name = potentialName;
                         console.log("Confirmed Name (default case):", productData.name);
                     }
                     // console.log(`Unhandled key: ${key}, Value: ${value}`);
                    break;
            }
        } else if (isParsingSpecs && matchListItem) {
             console.log("Matched List Item:", matchListItem[1]);
             if (!productData.specifications) {
                 productData.specifications = [];
             }
             const specValue = matchListItem[1].trim();
             if (!productData.specifications.find(s => s.value === specValue)) {
                 // Ở đây chỉ có value, label để trống hoặc bạn có thể gán mặc định
                 productData.specifications.push({ label: '', value: specValue });
                 console.log("Added Spec Item:", specValue);
             }
        } else if (line && index === lines.length - 1 && (line.toLowerCase().includes('hỗ trợ gì thêm không?') || line.toLowerCase().includes('bạn cần thêm thông tin gì'))) {
              console.log("Matched Outro line:", line);
             productData.comment = line;
             if (productData.shortDescription?.endsWith(line)) {
                 productData.shortDescription = productData.shortDescription.substring(0, productData.shortDescription.length - line.length).trim();
             }
        } else if (!productData.name && potentialName && line === potentialName) {
             productData.name = potentialName;
             console.log("Confirmed Name (plain line matches potential):", productData.name);
        }
    });

    if (!productData.name && potentialName) {
        productData.name = potentialName;
        console.log("Confirmed Name (fallback to potential):", productData.name);
    }
    if (!productData.name && lines.length > 0 && !productData.intro && lines[0].includes(':') ) {
        productData.name = lines[0].split(':')[0].replace(/\*\*/g, '').trim();
        console.log("Confirmed Name (fallback to first line key):", productData.name);
    }


    console.log('--- Finished Product Info Parse ---');
    console.log('Final Parsed Data:', productData);
    return productData;
  }

  // --- HÀM MỚI: PHÂN TÍCH CHUỖI SO SÁNH SẢN PHẨM (productComparison) ---
  private parseProductComparisonContent(content: string): ProductComparisonData {
    console.log('--- Starting Product Comparison Parse ---');
    console.log('Raw content:', content);

    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);
    const result: ProductComparisonData = {
      intro: '',
      products: [],
      conclusion: DEFAULT_UPDATE_MSG, // Default conclusion
    };

    if (lines.length === 0) {
      console.warn('Parsing empty comparison content.');
      return result; // Trả về cấu trúc rỗng nhưng hợp lệ
    }

    let currentProduct: ProductComparisonData['products'][0] | null = null;
    let isParsingSpecs = false;
    let introLines: string[] = [];
    let productStartIndex = -1;

    // Tìm dòng bắt đầu của sản phẩm đầu tiên
    productStartIndex = lines.findIndex(line => line.startsWith('**') && line.endsWith(':**'));
    if (productStartIndex === -1) {
        // Fallback: Tìm dòng tên sản phẩm dạng **Name** không có dấu :
         productStartIndex = lines.findIndex(line => line.startsWith('**') && line.endsWith('**') && !line.includes(':'));
    }


    if (productStartIndex > 0) {
      // Các dòng trước đó là intro
      introLines = lines.slice(0, productStartIndex);
      result.intro = introLines.join(' ').replace(/^- /, '').trim();
    } else if (productStartIndex === 0 && lines[0].toLowerCase().startsWith('chào bạn')) {
        // Nếu dòng đầu tiên là lời chào và cũng là tên sản phẩm
        result.intro = lines[0].split('**')[0].trim(); // Lấy phần trước tên sản phẩm
    }
     else {
      // Mặc định coi dòng đầu là intro nếu không tìm thấy tên sản phẩm rõ ràng
      result.intro = lines[0];
      productStartIndex = 1; // Bắt đầu xử lý sản phẩm từ dòng 1
    }
     console.log("Parsed Intro:", result.intro);


    for (let i = productStartIndex >= 0 ? productStartIndex : 0; i < lines.length; i++) {
      const line = lines[i];
       console.log(`Processing comparison line ${i}: "${line}"`);

      // Phát hiện tên sản phẩm mới (dạng **Name:** hoặc **Name**)
      const productNameMatch = line.match(/^\*\*(.*?):\*\*$/); // Chính xác **Name:**
      const productNameMatchStandalone = !productNameMatch && line.startsWith('**') && line.endsWith('**') && !line.includes(':'); // Dạng **Name**
      let potentialProductName = "";

      if (productNameMatch) {
          potentialProductName = productNameMatch[1].trim();
      } else if (productNameMatchStandalone) {
          potentialProductName = line.replace(/\*\*/g, '').trim();
      }


      if (potentialProductName && potentialProductName.length > 0) {
         console.log("Found new product block:", potentialProductName);
        // Bắt đầu một sản phẩm mới
        isParsingSpecs = false; // Reset trạng thái parse specs
        currentProduct = {
          name: potentialProductName,
          sku: DEFAULT_UPDATE_MSG,
          category: DEFAULT_UPDATE_MSG,
          shortDescription: DEFAULT_UPDATE_MSG,
          specifications: [],
          warranty: DEFAULT_UPDATE_MSG,
          price: 0, // Default price
          priceString: DEFAULT_UPDATE_MSG,
          promotion: DEFAULT_UPDATE_MSG,
          stockStatus: DEFAULT_UPDATE_MSG,
          policies: {
            return: DEFAULT_UPDATE_MSG,
            shipping: DEFAULT_UPDATE_MSG,
            payment: DEFAULT_UPDATE_MSG,
          },
          // manufacturer: DEFAULT_UPDATE_MSG // Bỏ comment nếu muốn thêm vào cấu trúc
        };
        result.products.push(currentProduct);
        continue; // Chuyển sang dòng tiếp theo sau khi xác định tên sản phẩm
      }

      // Nếu chưa có sản phẩm nào được bắt đầu, bỏ qua dòng này (có thể là phần intro chưa xử lý hết)
      if (!currentProduct) {
        // Kiểm tra xem có phải dòng kết luận không
        if (i === lines.length - 1 && (line.toLowerCase().includes('hỗ trợ gì thêm không') || line.toLowerCase().includes('bạn cần thêm thông tin gì'))) {
           result.conclusion = line;
           console.log("Found conclusion (early):", line);
        } else {
            console.log("Skipping line, no current product:", line);
        }
        continue;
      }

      // Phân tích các thuộc tính key-value (dạng `- **Key:** Value`)
      const matchKeyValue = line.match(/^- \*\*(.*?):\*\*\s*(.*)/);
      const matchListItem = line.match(/^- (.*)/);

      if (matchKeyValue) {
        isParsingSpecs = false; // Dừng parse specs nếu gặp key-value mới
        const key = matchKeyValue[1].trim().toLowerCase();
        const value = matchKeyValue[2].trim();
        console.log("Matched Product Key-Value:", key, "=>", value);

        switch (key) {
          case 'danh mục':
            currentProduct.category = value;
            break;
          case 'nhà sản xuất': // Lưu nếu cần, ví dụ vào currentProduct.manufacturer
            // currentProduct.manufacturer = value;
             console.log("Manufacturer found but not stored in default structure:", value);
            break;
          case 'mô tả':
            currentProduct.shortDescription = value;
            break;
          case 'khoảng giá': case 'giá': case 'mức giá':
             currentProduct.priceString = value;
             const priceMatch = value.match(/(\d[\d,.]*)/);
             if (priceMatch) {
                 // Lấy số đầu tiên tìm thấy làm giá
                 currentProduct.price = parseFloat(priceMatch[1].replace(/,/g, ''));
                 console.log("Parsed Price (number):", currentProduct.price);
             } else {
                 console.log("Could not parse number from price string:", value);
                 currentProduct.price = 0; // Hoặc NaN, hoặc giữ nguyên default
             }
            break;
          case 'bảo hành':
            currentProduct.warranty = value;
            break;
          case 'tình trạng': case 'tình trạng hàng':
            currentProduct.stockStatus = value;
            break;
          case 'khuyến mãi':
            currentProduct.promotion = value;
            break;
          case 'tính năng chính': case 'thông số kỹ thuật':
             console.log("Starting Product Specs Parsing...");
            isParsingSpecs = true;
            // Nếu có value ngay sau key này, có thể lưu làm mô tả chung cho specs
            if (value && !currentProduct.specifications.find(s => s.value === value)) {
                currentProduct.specifications.push({ label: 'Mô tả chung', value: value });
                 console.log("Added general spec description for product:", value);
            }
            break;
          // Thêm các case khác nếu có: 'Mã sản phẩm' -> sku, chính sách,...
          default:
            console.log(`Unhandled product key: ${key}, Value: ${value}`);
            break;
        }
      } else if (isParsingSpecs && matchListItem) {
         // Đây là một mục trong danh sách specifications
         const specValue = matchListItem[1].trim();
          console.log("Matched Product Spec Item:", specValue);
         // Tránh thêm mục trùng lặp nếu nó đã được thêm từ value của 'Tính năng chính'
         if (!currentProduct.specifications.find(s => s.value === specValue)) {
             // Label để trống vì format chỉ có value
             currentProduct.specifications.push({ label: '', value: specValue });
             console.log("Added Product Spec Item:", specValue);
         }
      } else if (i === lines.length - 1 && (line.toLowerCase().includes('hỗ trợ gì thêm không') || line.toLowerCase().includes('bạn cần thêm thông tin gì'))) {
        // Xử lý dòng cuối cùng là conclusion
        result.conclusion = line;
         console.log("Found conclusion (end):", line);

      } else if (line) {
           // Nếu dòng không khớp pattern nào và không phải dòng cuối, có thể là phần mô tả/specs chưa đúng format
           console.warn("Unparsed product line:", line);
           // Có thể thêm vào description hoặc specs nếu muốn
           // if (isParsingSpecs) { currentProduct.specifications.push({ label: 'Khác', value: line }); }
           // else if (currentProduct.shortDescription === DEFAULT_UPDATE_MSG) { currentProduct.shortDescription = line; }
      }
    }

    // Nếu conclusion vẫn là default và dòng cuối không phải conclusion, thử lấy dòng cuối làm conclusion
    if (result.conclusion === DEFAULT_UPDATE_MSG && lines.length > 0 && !(lines[lines.length - 1].toLowerCase().includes('hỗ trợ gì thêm không') || lines[lines.length - 1].toLowerCase().includes('bạn cần thêm thông tin gì'))) {
        // Kiểm tra xem dòng cuối có thuộc về sản phẩm cuối cùng không
        const lastLineBelongsToProduct = lines[lines.length - 1].startsWith('- ') || (lines.length > 1 && lines[lines.length-2].toLowerCase().includes('tính năng chính'));
        if (!lastLineBelongsToProduct) {
            result.conclusion = lines[lines.length - 1];
            console.log("Using last line as conclusion (fallback):", result.conclusion);
        }
    }


    console.log('--- Finished Product Comparison Parse ---');
    console.log('Final Parsed Data:', result);
    return result;
  }

  // --- HÀM RENDER MARKDOWN BOLD (cho tin nhắn text) ---
  renderMarkdownBold(text: any): string {
    if (typeof text !== 'string') {
      return ''; // Hoặc xử lý khác nếu content không phải string
    }
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }
}