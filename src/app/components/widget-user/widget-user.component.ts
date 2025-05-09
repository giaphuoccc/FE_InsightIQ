import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnInit,
  NgZone,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription, throwError } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators'; // Ensured switchMap is here

// Import child components and service
import { ProductInfoComponent } from './product-info/product-info.component';
import { ProductComparisonComponent } from './product-comparison/product-comparison.component';
import { ProductPromotionComponent } from './product-promotion/product-promotion.component';
import { SocketService } from '../../core/chatBot/socket.service';

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'bot';
  type: 'text' | 'productInfo' | 'productComparison' | 'productPromotion';
  content: any;
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
}

const API_BASE_URL = 'http://localhost:3001'; // Replace with your actual backend URL

@Component({
  selector: 'chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ProductInfoComponent,
    ProductComparisonComponent,
    ProductPromotionComponent,
  ],
  templateUrl: './widget-user.component.html',
  styleUrls: ['./widget-user.component.css'],
})
export class WidgetUserComponent implements OnInit, AfterViewInit, OnDestroy {
  showChatbox = false;
  isChatting = false;
  messageText: string = '';
  messages: ChatMessage[] = [];
  isBotResponding: boolean = false;
  private messageSubscription: Subscription | null = null;

  userName: string = '';
  userPhoneNumber: string = '';
  authError: string | null = null;
  isLoadingAuth: boolean = false;

  private currentSessionId: number | undefined = undefined;
  private currentSessionToken: string | undefined = undefined;
  retrievedTenantId: number | null = 1;

  @ViewChild('chatBox') chatBoxRef!: ElementRef;

  constructor(
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private socketService: SocketService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('>>> WidgetUserComponent CONSTRUCTOR running');
  }

  ngOnInit(): void {
    console.log('>>> WidgetUserComponent ngOnInit running');
    this.retrieveTenantIdFromScript();

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
            '>>> WidgetUserComponent: Received message from service:',
            botMessage
          );
          const finalMessage: ChatMessage = {
            ...botMessage,
            timestamp: botMessage.timestamp
              ? new Date(botMessage.timestamp)
              : new Date(),
            liked: botMessage.liked ?? false,
            disliked: botMessage.disliked ?? false,
            id: botMessage.id ?? this.generateId(),
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

    this.socketService.listenForSessionDetails().subscribe((details) => {
      console.log('>>> WidgetUserComponent: Received session details', details);
      if (details.sessionId) this.currentSessionId = details.sessionId;
      if (details.sessionToken) this.currentSessionToken = details.sessionToken;
    });
  }

  retrieveTenantIdFromScript(): void {
    if (isPlatformBrowser(this.platformId)) {
      const scriptTag = document.getElementById(
        'chatbot-script'
      ) as HTMLScriptElement;
      if (scriptTag && scriptTag.dataset['tenantId']) {
        // Fixed: Use bracket notation
        const tenantIdNum = parseInt(scriptTag.dataset['tenantId'], 10); // Fixed: Use bracket notation
        if (!isNaN(tenantIdNum)) {
          this.retrievedTenantId = tenantIdNum;
          console.log(
            '>>> Tenant ID retrieved from script tag:',
            this.retrievedTenantId
          );
        } else {
          console.error(
            '>>> Invalid Tenant ID format in script tag data attribute.'
          );
          this.authError =
            'Lỗi cấu hình: Không tìm thấy mã định danh hợp lệ (Tenant ID).';
        }
      } else {
        console.warn(
          '>>> Chatbot script tag with data-tenant-id not found or attribute missing.'
        );
        if (!this.retrievedTenantId) {
          this.authError = 'Lỗi cấu hình: Không thể xác định Tenant ID.';
          console.error(
            '>>> CRITICAL: Tenant ID could not be determined for the widget.'
          );
        }
      }
    }
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

  toggleChatbox(): void {
    this.showChatbox = !this.showChatbox;
    if (this.showChatbox && this.isChatting) {
      setTimeout(() => this.scrollToBottomIfNeeded(), 0);
    }
  }

  async processStartChat(): Promise<void> {
    this.authError = null;
    if (!this.userName.trim() || !this.userPhoneNumber.trim()) {
      this.authError = 'Vui lòng nhập tên và số điện thoại.';
      return;
    }
    if (this.retrievedTenantId === null) {
      this.authError =
        'Lỗi cấu hình: Không thể xác định Tenant ID. Không thể tiếp tục.';
      console.error('>>> processStartChat: Tenant ID is null.');
      this.isLoadingAuth = false; // Ensure loading state is reset
      this.cdRef.detectChanges(); // Update view with error
      return;
    }

    this.isLoadingAuth = true;
    this.cdRef.detectChanges();

    const loginPayload = {
      name: this.userName,
      phoneNumber: this.userPhoneNumber,
    };

    this.http
      .post<{ token: string }>(
        `${API_BASE_URL}/auth/user_chatbot/login`,
        loginPayload,
        { withCredentials: true }
      )
      .pipe(
        tap((loginResponse) => {
          console.log('>>> Login successful on first attempt:', loginResponse);
          this.completeAuthentication();
        }),
        catchError((loginError) => {
          if (loginError.status === 400 || loginError.status === 401) {
            console.log(
              '>>> Login failed, attempting signup:',
              loginError.error?.message
            );
            return this.attemptSignUpAndLogin();
          }
          this.authError =
            loginError.error?.message ||
            'Đăng nhập thất bại. Vui lòng thử lại.';
          this.isLoadingAuth = false;
          this.cdRef.detectChanges();
          return throwError(() => loginError);
        })
      )
      .subscribe({
        error: (finalError) => {
          if (!this.isChatting) {
            this.authError =
              this.authError ||
              finalError.error?.message ||
              'Đã có lỗi xảy ra. Vui lòng thử lại.'; // Preserve signup error if it exists
            this.isLoadingAuth = false;
            this.cdRef.detectChanges();
          }
          console.error('>>> Final error in processStartChat:', finalError);
        },
      });
  }

  private attemptSignUpAndLogin() {
    // tenantId null check is already done in processStartChat, but good for safety
    if (this.retrievedTenantId === null) {
      this.authError = 'Không thể đăng ký: Thiếu Tenant ID.';
      this.isLoadingAuth = false;
      this.cdRef.detectChanges();
      return throwError(() => new Error('Missing Tenant ID for signup'));
    }

    const signUpPayload = {
      name: this.userName,
      phoneNumber: this.userPhoneNumber,
      tenantId: this.retrievedTenantId,
    };

    return this.http
      .post<any>(`${API_BASE_URL}/user_chatbot/create`, signUpPayload)
      .pipe(
        tap((signUpResponse) =>
          console.log('>>> Signup successful:', signUpResponse)
        ),
        switchMap(() => {
          // Chained after successful signup
          console.log('>>> Attempting login after successful signup...');
          const loginPayload = {
            name: this.userName,
            phoneNumber: this.userPhoneNumber,
          };
          return this.http.post<{ token: string }>(
            `${API_BASE_URL}/auth/user_chatbot/login`,
            loginPayload,
            { withCredentials: true }
          );
        }),
        tap((loginAfterSignupResponse) => {
          console.log(
            '>>> Login after signup successful:',
            loginAfterSignupResponse
          );
          this.completeAuthentication();
        }),
        catchError((error) => {
          console.error(
            '>>> Error during signup or login after signup:',
            error
          );
          // Prioritize error message from the backend response if available
          this.authError =
            error.error?.message ||
            'Không thể hoàn tất đăng ký hoặc đăng nhập sau đăng ký.';
          this.isLoadingAuth = false;
          this.cdRef.detectChanges();
          return throwError(() => error);
        })
      );
  }

  private completeAuthentication(): void {
    this.isChatting = true;
    this.isLoadingAuth = false;
    this.authError = null;
    console.log('Chat started. Attempting to connect/reconnect socket.');
    this.socketService.connect();
    console.log(`Current tenant: ${this.retrievedTenantId}`);
    this.cdRef.detectChanges();
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

      const textarea = document.querySelector(
        '.message-input .chat-input'
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
      }

      this.isBotResponding = true;
      this.cdRef.detectChanges();
      this.scrollToBottomIfNeeded();

      const tenantIdToSend = this.retrievedTenantId;

      if (typeof tenantIdToSend !== 'number' || tenantIdToSend === null) {
        console.error(
          '>>> WidgetUserComponent: Tenant ID is missing! Cannot send message.'
        );
        this.isBotResponding = false;
        this.messages.push({
          id: this.generateId(),
          sender: 'bot',
          type: 'text',
          content:
            'Lỗi: Không thể gửi tin nhắn do thiếu thông tin định danh (Tenant ID). Vui lòng tải lại trang hoặc liên hệ hỗ trợ.',
          timestamp: new Date(),
        });
        this.cdRef.detectChanges();
        this.scrollToBottomIfNeeded();
        return;
      }

      const dataToSend = {
        text: text,
        tenantId: tenantIdToSend,
        sessionId: this.currentSessionId,
        sessionToken: this.currentSessionToken,
      };

      console.log(
        '>>> WidgetUserComponent: Sending message via socket',
        dataToSend
      );
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
    this.currentSessionId = undefined;
    this.currentSessionToken = undefined;
    console.log('Chat cleared. Chat session ID and token reset.');
    this.cdRef.detectChanges();
    this.scrollToBottomIfNeeded();
  }

  toggleLike(msg: ChatMessage): void {
    if (!msg.id) return;
    msg.liked = !msg.liked;
    if (msg.liked) msg.disliked = false;
    console.log(`Message ${msg.id} Liked: ${msg.liked}`);
    this.cdRef.detectChanges();
  }

  toggleDislike(msg: ChatMessage): void {
    if (!msg.id) return;
    msg.disliked = !msg.disliked;
    if (msg.disliked) msg.liked = false;
    console.log(`Message ${msg.id} Disliked: ${msg.disliked}`);
    this.cdRef.detectChanges();
  }

  stopBotResponse(): void {
    console.log(
      '>>> WidgetUserComponent: Stop bot response requested by user.'
    );
    this.isBotResponding = false;
    this.cdRef.detectChanges();
  }

  renderMarkdownBold(text: any): string {
    if (typeof text !== 'string') {
      return '';
    }
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }
}
