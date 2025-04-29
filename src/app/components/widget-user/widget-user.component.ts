import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnInit,
  NgZone,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Import các component con và service
import { ProductInfoComponent } from './product-info/product-info.component';
import { ProductComparisonComponent } from './product-comparison/product-comparison.component';
import { ProductPromotionComponent } from './product-promotion/product-promotion.component';
//import { SocketService } from '../../core/chatBotService/socket.service'; // <<< KIỂM TRA LẠI ĐƯỜNG DẪN NÀY
import { SocketService } from '../../core/chatBot/socket.service';
// --- Định nghĩa interface cho tin nhắn ---
// (Có thể tách ra file riêng *.interface.ts nếu muốn)
export interface ChatMessage {
  id?: string; // ID là tùy chọn, thường do server/client tạo
  sender: 'user' | 'bot';
  // Các type này phải khớp với giá trị 'responseType' trả về từ backend
  type: 'text' | 'productInfo' | 'productComparison' | 'productPromotion';
  content: any; // Có thể là string hoặc object (như ProductData)
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
}

// --- Định nghĩa interface cho dữ liệu sản phẩm ---
// (Cũng có thể tách ra file riêng)
export interface ProductData {
  intro?: string; // Phần giới thiệu ban đầu
  name?: string;
  category?: string;
  manufacturer?: string; // Thêm nhà sản xuất
  shortDescription?: string;
  specifications?: { label: string; value: string }[];
  price?: number; // Sử dụng number cho giá
  priceString?: string; // Giữ lại chuỗi giá gốc (vd: $300 - $350)
  promotion?: string;
  stockStatus?: string;
  warranty?: string;
  comment?: string; // Phần kết luận/nhận xét từ bot
  imageUrl?: string; // Thêm URL ảnh nếu backend có thể trả về
  // Thêm các trường khác nếu cần
}


@Component({
  selector: 'chatbot', // Tên selector bạn dùng trong HTML khác: <chatbot></chatbot>
  standalone: true,
  imports: [
    CommonModule, // Cần cho *ngIf, *ngFor, pipe date,...
    FormsModule,  // Cần cho [(ngModel)]
    // Import các component con sẽ dùng trong template qua ngSwitch
    ProductInfoComponent,
    ProductComparisonComponent,
    ProductPromotionComponent
  ],
  templateUrl: './widget-user.component.html',
  styleUrls: ['./widget-user.component.css']
})
export class WidgetUserComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- Thuộc tính của Component ---
  showChatbox = false;
  isChatting = false; // Trạng thái đã bắt đầu chat (đã nhập tên/sđt)
  messageText: string = ''; // Nội dung người dùng nhập
  messages: ChatMessage[] = []; // Mảng chứa tất cả tin nhắn hiển thị
  isBotResponding: boolean = false; // Cờ báo hiệu bot đang xử lý, hiển thị icon stop
  private messageSubscription: Subscription | null = null; // Để hủy lắng nghe khi component bị hủy

  // Biến lưu trữ thông tin session (VÍ DỤ - cần có cách lấy/lưu trữ thực tế, ví dụ qua Service hoặc LocalStorage)
  private currentSessionId: number | undefined = undefined;
  private currentSessionToken: string | undefined = undefined;
  private currentTenantId: number = 1; // <<<=== LẤY TENANT ID TỪ ĐÂU??? Ví dụ: Service, State Management, URL,...

  @ViewChild('chatBox') chatBoxRef!: ElementRef; // Tham chiếu đến div chứa tin nhắn để scroll

  // --- Constructor ---
  constructor(
    private cdRef: ChangeDetectorRef, // Để trigger cập nhật view thủ công nếu cần
    private ngZone: NgZone,         // Để chạy code liên quan đến UI trong Angular zone
    private socketService: SocketService // Inject SocketService để giao tiếp với backend
  ) {
    console.log('>>> WidgetUserComponent CONSTRUCTOR running');
  }

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    console.log('>>> WidgetUserComponent ngOnInit running');
    // Khởi tạo tin nhắn chào mừng ban đầu
    this.messages = [
        {
          id: this.generateId(),
          sender: 'bot',
          type: 'text',
          content: 'Xin chào! Bạn cần InsightIQ hỗ trợ về sản phẩm nào ạ?',
          timestamp: new Date()
        }
    ];

    // Hủy subscription cũ nếu có (phòng trường hợp ngOnInit chạy lại)
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    // Lắng nghe tin nhắn mới từ SocketService
    this.messageSubscription = this.socketService.listenForNewMessages().subscribe({
      next: (botMessage: ChatMessage) => {
        console.log(">>> WidgetUserComponent: Received raw message from service", botMessage);

        let processedContent: any = botMessage.content; // Mặc định giữ nguyên content

        // *** BƯỚC QUAN TRỌNG: Phân tích content nếu là productInfo ***
        if (botMessage.type === 'productInfo' && typeof botMessage.content === 'string') {
           try {
              processedContent = this.parseProductInfoContent(botMessage.content);
              console.log(">>> WidgetUserComponent: Parsed Product Info:", processedContent);
           } catch (error) {
              console.error(">>> WidgetUserComponent: Error parsing product info content:", error);
              // Nếu lỗi parse, hiển thị thông báo lỗi hoặc giữ content gốc
              processedContent = `Xin lỗi, đã có lỗi xảy ra khi hiển thị thông tin sản phẩm. Nội dung gốc: ${botMessage.content}`;
           }
        }
        // *** KẾT THÚC BƯỚC PHÂN TÍCH ***

        // Tạo đối tượng tin nhắn cuối cùng để thêm vào mảng
        const finalMessage: ChatMessage = {
            ...botMessage, // Giữ lại id, sender, type, timestamp,... từ botMessage
            content: processedContent, // Sử dụng content đã được xử lý
            timestamp: botMessage.timestamp ? new Date(botMessage.timestamp) : new Date(), // Đảm bảo là Date object
            // Khởi tạo liked/disliked nếu chưa có từ server
            liked: botMessage.liked ?? false,
            disliked: botMessage.disliked ?? false
        };

        // Logic thêm hoặc cập nhật tin nhắn (tìm theo ID nếu server trả về ID của tin nhắn nó đang phản hồi)
        // Trong ví dụ này, giả sử server luôn trả về tin nhắn mới, nên chỉ cần push
        this.messages.push(finalMessage);

        this.isBotResponding = false; // Bot đã phản hồi xong
        this.cdRef.detectChanges(); // Thông báo Angular cập nhật view
        this.scrollToBottomIfNeeded(); // Cuộn xuống tin nhắn mới nhất
      },
      error: (err: any) => {
        console.error('>>> WidgetUserComponent: Error receiving message:', err);
        this.isBotResponding = false; // Dừng trạng thái chờ
        // Hiển thị thông báo lỗi chung cho người dùng
        this.messages.push({
            id: this.generateId(),
            sender: 'bot',
            type: 'text',
            content: 'Xin lỗi, đã có lỗi kết nối hoặc xử lý từ máy chủ. Vui lòng thử lại sau.',
            timestamp: new Date()
        });
        this.cdRef.detectChanges();
        this.scrollToBottomIfNeeded();
      }
    });

    // (Tùy chọn) Kết nối socket nếu chưa tự động kết nối trong service
    // this.socketService.connect();

    // (Tùy chọn) Lắng nghe các sự kiện khác từ socket nếu cần
    // this.socketService.getConnectionStatus().subscribe(...)
    // this.socketService.listenForErrors().subscribe(...)
  }

  ngAfterViewInit(): void {
    // Cuộn xuống dưới cùng sau khi view đã khởi tạo (nếu đang chat)
    if (this.isChatting && this.showChatbox) {
      this.scrollToBottomIfNeeded();
    }
  }

  ngOnDestroy(): void {
    console.log(">>> WidgetUserComponent ngOnDestroy");
    // Hủy lắng nghe và ngắt kết nối khi component bị hủy
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }
    this.socketService.disconnect(); // Ngắt kết nối socket
  }

  // --- Các phương thức xử lý sự kiện và logic khác ---

  toggleChatbox(): void {
    this.showChatbox = !this.showChatbox;
    // Nếu mở chatbox và đang chat, cuộn xuống dưới
    if (this.showChatbox && this.isChatting) {
      this.scrollToBottomIfNeeded();
    }
  }

  // Hàm này có thể phức tạp hơn, ví dụ lưu tên/sđt, gọi API lấy session,...
  startChat(): void {
    // Tạm thời chỉ chuyển trạng thái để hiện giao diện chat
    this.isChatting = true;
    // Cần logic để lấy/tạo currentSessionId, currentSessionToken nếu dùng
    // Ví dụ: Gọi API backend để bắt đầu session mới
    console.log("Chat started. Need logic to get/set session info.");
    // Cuộn xuống dưới sau khi giao diện chat hiện ra
    setTimeout(() => this.scrollToBottomIfNeeded(), 0);
  }

  // Tự động mở rộng textarea khi nhập liệu
  autoExpand(event: Event): void {
      const textarea = event.target as HTMLTextAreaElement;
      textarea.style.height = 'auto'; // Reset chiều cao
      textarea.style.height = textarea.scrollHeight + 'px'; // Đặt chiều cao bằng nội dung
  }

  // Xử lý nhấn Enter để gửi tin nhắn (Shift + Enter để xuống dòng)
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Ngăn hành vi mặc định (xuống dòng)
      this.onSendMessage();
    }
  }

  // Gửi tin nhắn đi
  onSendMessage(): void {
      const text = this.messageText.trim();
      if (text && this.socketService) { // Chỉ gửi nếu có nội dung và service tồn tại
        // 1. Tạo tin nhắn của người dùng và hiển thị ngay lập tức
        const userMessage: ChatMessage = {
          id: this.generateId(), // Tạo ID tạm thời cho client
          sender: 'user',
          type: 'text',
          content: text,
          timestamp: new Date()
        };
        this.messages.push(userMessage);
        this.messageText = ''; // Xóa nội dung trong input

        // Reset chiều cao textarea sau khi gửi
        const textarea = document.querySelector('.message-input .chat-input') as HTMLTextAreaElement;
        if (textarea) {
          textarea.style.height = 'auto'; // Có thể đặt về giá trị cố định ban đầu nếu muốn
        }

        // 2. Đặt trạng thái đang chờ bot phản hồi
        this.isBotResponding = true;
        this.cdRef.detectChanges(); // Cập nhật view để hiển thị icon stop
        this.scrollToBottomIfNeeded(); // Cuộn xuống tin nhắn vừa gửi

        // 3. Chuẩn bị dữ liệu gửi lên server qua socket
        // !!! QUAN TRỌNG: Cần có logic thực tế để lấy các giá trị này !!!
        const tenantIdToSend = this.currentTenantId; // Lấy từ thuộc tính (cần cách lấy đúng)
        const sessionIdToSend = this.currentSessionId; // Lấy từ thuộc tính (cần cách lấy đúng)
        const sessionTokenToSend = this.currentSessionToken; // Lấy từ thuộc tính (cần cách lấy đúng)

        // Kiểm tra các giá trị cần thiết trước khi gửi
        if (typeof tenantIdToSend === 'undefined') {
            console.error(">>> WidgetUserComponent: Tenant ID is missing! Cannot send message.");
            this.isBotResponding = false; // Tắt trạng thái chờ
            // Hiển thị lỗi cho người dùng
            this.messages.push({
                id: this.generateId(),
                sender: 'bot',
                type: 'text',
                content: 'Lỗi: Không thể gửi tin nhắn do thiếu thông tin định danh (Tenant ID).',
                timestamp: new Date()
            });
            this.cdRef.detectChanges();
            this.scrollToBottomIfNeeded();
            return;
        }

        const dataToSend = {
            text: text,
            tenantId: tenantIdToSend,
            sessionId: sessionIdToSend, // Gửi undefined nếu chưa có
            sessionToken: sessionTokenToSend // Gửi undefined nếu chưa có
        };

        // 4. Gọi hàm sendMessage của SocketService
        console.log(">>> WidgetUserComponent: Sending message via socket", dataToSend);
        this.socketService.sendMessage(dataToSend);
      }
    }

  // Cuộn div chat xuống dưới cùng
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

  // Hàm tiện ích để cuộn xuống (chạy trong NgZone để đảm bảo ổn định)
  scrollToBottomIfNeeded(): void {
    this.ngZone.runOutsideAngular(() => { // Chạy ngoài zone để tránh trigger change detection không cần thiết
        setTimeout(() => {
            this.ngZone.run(() => { // Quay lại zone để cập nhật DOM nếu cần
               this.scrollToBottom();
            });
        }, 0); // Đợi một chút để DOM kịp cập nhật trước khi cuộn
    });
  }

  // Tạo ID ngẫu nhiên đơn giản cho tin nhắn phía client
  generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Xóa lịch sử chat hiện tại
  clearChat(): void {
      this.messages = [
        {
          id: this.generateId(),
          sender: 'bot',
          type: 'text',
          content: 'Chào bạn, InsightIQ có thể giúp gì cho bạn?', // Tin nhắn chào lại sau khi xóa
          timestamp: new Date()
        }
      ];
      // Cân nhắc việc reset session ID/token ở đây nếu cần bắt đầu phiên mới hoàn toàn
      // this.currentSessionId = undefined;
      // this.currentSessionToken = undefined;
      console.log("Chat cleared.");
      this.cdRef.detectChanges();
      this.scrollToBottomIfNeeded(); // Cuộn lên đầu sau khi xóa (hoặc giữ nguyên tùy ý)
    }

  // Xử lý sự kiện like/dislike (ví dụ)
  toggleLike(msg: ChatMessage): void {
      if (!msg.id) return; // Cần ID để gửi feedback (nếu có)
      msg.liked = !msg.liked;
      if (msg.liked) msg.disliked = false; // Không thể vừa like vừa dislike
      console.log(`Message ${msg.id} Liked: ${msg.liked}`);
      // TODO: Gửi feedback này lên server nếu cần (gọi một phương thức khác của SocketService)
      // this.socketService.sendFeedback({ messageId: msg.id, reaction: 'like' });
      this.cdRef.detectChanges(); // Cập nhật giao diện nút bấm
    }

  toggleDislike(msg: ChatMessage): void {
      if (!msg.id) return;
      msg.disliked = !msg.disliked;
      if (msg.disliked) msg.liked = false;
      console.log(`Message ${msg.id} Disliked: ${msg.disliked}`);
      // TODO: Gửi feedback này lên server nếu cần
      // this.socketService.sendFeedback({ messageId: msg.id, reaction: 'dislike' });
       this.cdRef.detectChanges();
    }

  // Xử lý khi người dùng bấm nút dừng phản hồi của bot
  stopBotResponse(): void {
    console.log(">>> WidgetUserComponent: Stop bot response requested by user.");
    // Cần có cơ chế thực sự để hủy yêu cầu/stream phía server và SocketService
    // Ví dụ: this.socketService.cancelCurrentRequest();
    this.isBotResponding = false; // Tạm thời chỉ ẩn nút stop và hiện nút send
    this.cdRef.detectChanges();
  }


  // --- HÀM PHÂN TÍCH CHUỖI THÔNG TIN SẢN PHẨM ---
  private parseProductInfoContent(content: string): Partial<ProductData> {
    console.log("--- Starting Product Info Parse ---");
    console.log("Raw content:", content);

    const productData: Partial<ProductData> = { specifications: [] }; // Khởi tạo với mảng specs rỗng
    const lines = content.split('\n').map(line => line.trim()).filter(line => line); // Tách dòng, bỏ trống

    if (lines.length === 0) {
        console.warn("Parsing empty content.");
        return {};
    }

    let isParsingSpecs = false;
    let potentialName = '';

    // Heuristic: Lấy phần giới thiệu (các dòng trước dòng có **: đầu tiên)
    const firstDetailIndex = lines.findIndex(line => line.includes('**:'));
    console.log("First Detail Index:", firstDetailIndex);

    if (firstDetailIndex > 0) {
        productData.intro = lines.slice(0, firstDetailIndex).join(' ').replace(/^- /, '').trim();
        console.log("Parsed Intro:", productData.intro);
    } else if (firstDetailIndex === -1) {
        // Nếu không có "**:", kiểm tra xem dòng đầu có phải giới thiệu không
        const firstLineLooksLikeIntro = !lines[0].includes(':') && !lines[0].startsWith('- **') && !lines[0].startsWith('**');
        if (firstLineLooksLikeIntro) {
            productData.intro = lines[0].replace(/^- /, '').trim();
             console.log("Parsed Intro (fallback):", productData.intro);
        }
    } else if (firstDetailIndex === 0 && lines[0].toLowerCase().startsWith('chào bạn')) {
        // Trường hợp dòng đầu tiên là lời chào và cũng là dòng detail đầu tiên
         productData.intro = lines[0].split('**:')[0] + '**:' ; // Giữ lại phần chào
         console.log("Parsed Intro (greeting case):", productData.intro);
    }


    lines.forEach((line, index) => {
        console.log(`Processing line ${index}: "${line}"`);
        // Bỏ qua các dòng đã được xác định là intro
        if (productData.intro && firstDetailIndex > 0 && index < firstDetailIndex) {
           console.log("Skipping line (already part of intro)");
           return;
        }

        // Cố gắng tìm tên sản phẩm (thường là text đậm đầu tiên có dấu : hoặc đứng một mình)
        if (!productData.name && line.startsWith('**') && line.includes('**:')) {
             potentialName = line.split('**:')[0].replace('**', '').trim();
             console.log("Potential Name found (from key):", potentialName);
        } else if (!productData.name && line.startsWith('**') && line.endsWith('**') && !line.includes(':') && !line.toLowerCase().includes('tính năng') && !line.toLowerCase().includes('thông số')) {
             potentialName = line.replace(/\*\*/g, '').trim();
             console.log("Potential Name found (standalone bold):", potentialName);
        }

        const matchKeyValue = line.match(/^-?\s*\*\*(.*?):\*\*\s*(.*)/); // Bắt cả dạng `- **Label:** Value` và `**Label:** Value`
        const matchListItem = line.match(/^- (.*)/);

        if (matchKeyValue) {
            console.log("Matched Key-Value:", matchKeyValue[1], "=>", matchKeyValue[2]);
            isParsingSpecs = false; // Dừng parse specs khi gặp key-value mới
            const key = matchKeyValue[1].trim().toLowerCase();
            let value = matchKeyValue[2].trim();

             // Gán tên nếu chưa có và key này khớp với tên tiềm năng đã tìm thấy
             if (!productData.name && potentialName && key === potentialName.toLowerCase()) {
                 productData.name = potentialName;
                 console.log("Confirmed Name:", productData.name);
             } else if (!productData.name && potentialName && value.toLowerCase().includes(potentialName.toLowerCase())) {
                 // Đôi khi tên nằm trong value của dòng giới thiệu đầu tiên
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
                case 'mức giá': case 'giá':
                    productData.priceString = value; // Lưu chuỗi giá gốc
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
                    isParsingSpecs = true; // Bắt đầu tìm các dòng specs
                    // Nếu có value ngay sau key này, lưu lại (ví dụ: mô tả chung cho specs)
                    if (value && !productData.specifications?.find(s => s.value === value)) {
                         productData.specifications = productData.specifications || [];
                         productData.specifications.push({ label: 'Mô tả chung', value: value });
                         console.log("Added general spec description:", value);
                    }
                    break;
                 // Thêm các case khác nếu cần: 'Mã sản phẩm', 'SKU',...
                default:
                     // Gán tên nếu chưa có và key này có vẻ là tên (không phải các key thông thường)
                     if (!productData.name && potentialName && key === potentialName.toLowerCase()){
                         productData.name = potentialName;
                         console.log("Confirmed Name (default case):", productData.name);
                     }
                    // console.log(`Unhandled key: ${key}, Value: ${value}`);
                    break;
            }
        } else if (isParsingSpecs && matchListItem) {
             console.log("Matched List Item:", matchListItem[1]);
            // Đây là một mục trong danh sách specifications
            if (!productData.specifications) {
                productData.specifications = []; // Khởi tạo nếu chưa có
            }
            const specValue = matchListItem[1].trim();
            // Tránh thêm mục trùng lặp nếu nó đã được thêm từ value của 'Tính năng chính'
            if (!productData.specifications.find(s => s.value === specValue)) {
                 productData.specifications.push({ label: '', value: specValue }); // Chỉ lưu value
                 console.log("Added Spec Item:", specValue);
            }

        } else if (line && index === lines.length - 1 && line.toLowerCase().includes('hỗ trợ gì thêm không?')) {
             // Heuristic: Dòng cuối cùng là comment/outro
             console.log("Matched Outro line:", line);
             productData.comment = line;
             // Xóa khỏi description nếu bị trùng lặp
             if (productData.shortDescription?.endsWith(line)) {
                productData.shortDescription = productData.shortDescription.substring(0, productData.shortDescription.length - line.length).trim();
             }
        } else if (!productData.name && potentialName && line === potentialName) {
             // Trường hợp tên nằm trên 1 dòng riêng và không có ** bao quanh
             productData.name = potentialName;
             console.log("Confirmed Name (plain line matches potential):", productData.name);
        }
    });

    // Fallback: Nếu vẫn chưa tìm được tên, thử lấy từ potentialName
    if (!productData.name && potentialName) {
         productData.name = potentialName;
         console.log("Confirmed Name (fallback to potential):", productData.name);
    }
     // Fallback: Nếu không có tên, thử lấy từ dòng đầu tiên nếu nó có vẻ là tên
    if (!productData.name && lines.length > 0 && !productData.intro && lines[0].includes(':') ) {
         productData.name = lines[0].split(':')[0].replace(/\*\*/g, '').trim();
         console.log("Confirmed Name (fallback to first line key):", productData.name);
    }

    console.log("--- Finished Product Info Parse ---");
    console.log("Final Parsed Data:", productData);
    return productData;
  }

} // Kết thúc class WidgetUserComponent