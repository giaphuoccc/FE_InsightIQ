// --- Định nghĩa interface cho tin nhắn ---
import { Subscription } from 'rxjs';
//import { SocketService } from '../../core/chatBot/socket.service'; // Đảm bảo import đúng
import { SocketService } from '../../core/chatBot/socket.service';

export interface ChatMessage {
  sender: 'user' | 'bot';
  type: 'text' | 'productInfo' | 'productComparison' | 'productPromotion';
  content: any;
  timestamp: Date;
  id?: string;
  liked?: boolean;
  disliked?: boolean;
}

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
import { ProductInfoComponent } from './product-info/product-info.component';
import { ProductComparisonComponent } from './product-comparison/product-comparison.component';
import { ProductPromotionComponent } from './product-promotion/product-promotion.component';

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
  templateUrl: './widget-user.component.html',
  styleUrls: ['./widget-user.component.css']
})
export class WidgetUserComponent implements OnInit, AfterViewInit, OnDestroy {
  showChatbox = false;
  isChatting = false;
  messageText: string = '';
  messages: ChatMessage[] = [];
  isBotResponding: boolean = false;
  private messageSubscription: Subscription | null = null;

  // Biến lưu trữ thông tin session (VÍ DỤ - cần có cách lấy thực tế)
  private currentSessionId: number | undefined = undefined;
  private currentSessionToken: string | undefined = undefined;
  private currentTenantId: number = 1; // <<<=== LẤY TENANT ID TỪ ĐÂU??? Cần thay đổi

  @ViewChild('chatBox') chatBoxRef!: ElementRef;

  constructor(
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private socketService: SocketService // <-- Đã bỏ comment
  ) {
     console.log('>>> WidgetUserComponent CONSTRUCTOR running (Step 3 Active)');
  }

  ngOnInit(): void {
    console.log('>>> WidgetUserComponent ngOnInit running (Step 3 Active)');
    this.messages = [
      {
        id: this.generateId(),
        sender: 'bot',
        type: 'text',
        content: 'Xin chào! Bạn muốn hỏi về sản phẩm nào ạ?',
        timestamp: new Date()
      }
    ];

    // --- BỎ COMMENT PHẦN LIÊN QUAN ĐẾN SOCKET SERVICE ---
    // this.socketService.connect(); // Gọi nếu bạn không tự connect trong constructor của service

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    // Lắng nghe tin nhắn mới từ service
    this.messageSubscription = this.socketService.listenForNewMessages().subscribe({
      next: (botMessage: ChatMessage) => { // Đảm bảo kiểu dữ liệu đúng
        console.log(">>> WidgetUserComponent: Received message from service", botMessage); // Log khi nhận
        // --- Xử lý logic thêm/cập nhật tin nhắn ---
         const existingMessageIndex = this.messages.findIndex(msg => msg.id && msg.id === botMessage.id);

         if (existingMessageIndex > -1) {
           this.messages[existingMessageIndex] = {
             ...this.messages[existingMessageIndex],
             ...botMessage,
             // Đảm bảo timestamp là Date object
             timestamp: botMessage.timestamp ? new Date(botMessage.timestamp) : new Date()
           };
         } else {
           this.messages.push({
             ...botMessage,
              // Đảm bảo timestamp là Date object
             timestamp: botMessage.timestamp ? new Date(botMessage.timestamp) : new Date()
           });
         }
        // --- Kết thúc xử lý ---

        this.isBotResponding = false; // Bot đã phản hồi xong
        this.cdRef.detectChanges(); // Thông báo Angular cập nhật view
        this.scrollToBottomIfNeeded();
      },

      error: (err) => {
        console.error('>>> WidgetUserComponent: Error receiving message:', err);
        this.isBotResponding = false; // Ngừng trạng thái chờ nếu có lỗi
        // Có thể hiển thị thông báo lỗi cho người dùng
      }
    });

    // (Tùy chọn) Lắng nghe session details nếu backend gửi về
    // this.socketService.listenForSessionDetails().subscribe(details => {
    //    console.log(">>> WidgetUserComponent: Received session details", details);
    //    this.currentSessionId = details.sessionId;
    //    this.currentSessionToken = details.sessionToken;
    //    // Lưu lại session info nếu cần (localStorage, state management)
    // });

    // (Tùy chọn) Lắng nghe lỗi chung từ socket
    // this.socketService.listenForErrors().subscribe(error => {
    //    console.error(">>> WidgetUserComponent: Received socket error", error);
    //    // Hiển thị lỗi cho người dùng
    // });

    // (Tùy chọn) Lắng nghe trạng thái kết nối
    // this.socketService.getConnectionStatus().subscribe(isConnected => {
    //    console.log(">>> WidgetUserComponent: Socket connection status:", isConnected);
    //    if (!isConnected) {
    //       // Xử lý khi mất kết nối
    //    }
    // });

  }

  ngAfterViewInit(): void {
    if (this.isChatting && this.showChatbox) {
      this.scrollToBottomIfNeeded();
    }
  }

  ngOnDestroy(): void {
     console.log(">>> WidgetUserComponent ngOnDestroy");
     this.socketService.disconnect(); // <-- Bỏ comment
     if (this.messageSubscription) {
       this.messageSubscription.unsubscribe(); // <-- Bỏ comment
       this.messageSubscription = null;
     }
   }

  toggleChatbox(): void {
    this.showChatbox = !this.showChatbox;
    if (this.showChatbox && this.isChatting) {
      this.scrollToBottomIfNeeded();
    }
  }

  startChat(): void {
    this.isChatting = true;
    // Khi bắt đầu chat, có thể cần lấy session ID/token nếu chưa có
    // Hoặc chỉ đơn giản là hiển thị giao diện
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
     if (text && this.socketService) { // Kiểm tra thêm socketService tồn tại
       const userMessage: ChatMessage = {
         id: this.generateId(),
         sender: 'user',
         type: 'text',
         content: text,
         timestamp: new Date()
       };
       this.messages.push(userMessage);
       this.messageText = '';

       const textarea = document.querySelector('.message-input .chat-input') as HTMLTextAreaElement;
       if (textarea) {
         textarea.style.height = 'auto';
         textarea.style.height = '40px';
       }

       this.isBotResponding = true; // Bật trạng thái chờ bot phản hồi
       this.cdRef.detectChanges();
       this.scrollToBottomIfNeeded();

       // Lấy thông tin cần thiết để gửi đi
       // !!! QUAN TRỌNG: Bạn cần có logic thực tế để lấy các giá trị này !!!
       const tenantIdToSend = this.currentTenantId; // Lấy từ thuộc tính component (cần có cách lấy đúng)
       const sessionIdToSend = this.currentSessionId; // Lấy từ thuộc tính component (cần có cách lấy đúng)
       const sessionTokenToSend = this.currentSessionToken; // Lấy từ thuộc tính component (cần có cách lấy đúng)

       if (typeof tenantIdToSend === 'undefined') {
           console.error(">>> WidgetUserComponent: Tenant ID is missing! Cannot send message.");
           this.isBotResponding = false; // Tắt trạng thái chờ
           // Có thể hiển thị lỗi cho người dùng
           return;
       }

       const dataToSend = {
           text: text,
           tenantId: tenantIdToSend,
           sessionId: sessionIdToSend,
           sessionToken: sessionTokenToSend
       };

       this.socketService.sendMessage(dataToSend); // <-- Bỏ comment
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
    this.ngZone.run(() => {
      setTimeout(() => {
        this.scrollToBottom();
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
         content: 'Xin chào! Bạn muốn hỏi về sản phẩm nào ạ?',
         timestamp: new Date()
       }
     ];
     // Reset session? Tùy logic
     // this.currentSessionId = undefined;
     // this.currentSessionToken = undefined;
     this.cdRef.detectChanges();
     this.scrollToBottomIfNeeded();
   }

  toggleLike(msg: ChatMessage): void {
     msg.liked = !msg.liked;
     if (msg.liked) msg.disliked = false;
     // Gửi feedback lên server? (Tùy chọn)
   }

  toggleDislike(msg: ChatMessage): void {
     msg.disliked = !msg.disliked;
     if (msg.disliked) msg.liked = false;
     // Gửi feedback lên server? (Tùy chọn)
   }

  stopBotResponse(): void {
    console.log(">>> WidgetUserComponent: Stop bot response requested.");
    // Cần thêm logic hủy stream/request ở SocketService và gọi ở đây nếu có
    // Ví dụ: this.socketService.cancelResponseStream();
    this.isBotResponding = false;
    this.cdRef.detectChanges();
  }

}