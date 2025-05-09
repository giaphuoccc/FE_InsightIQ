// FrontEnd/components/widget-user/widget-user.component.ts
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
  inject,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription, throwError } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';

import { ProductInfoComponent } from './product-info/product-info.component';
import { ProductComparisonComponent } from './product-comparison/product-comparison.component';
import { ProductPromotionComponent } from './product-promotion/product-promotion.component';
import {
  SocketService,
  ServiceChatMessage,
} from '../../core/chatBot/socket.service'; // Import ServiceChatMessage
import { FeedbackService, FeedbackPayload } from '../../core/feedback.service';
import { Rating } from '../../core/chatBot/feedback.enum';

const API_BASE_URL = 'http://localhost:3001';

// Interface for messages stored and displayed within this component
export interface ComponentChatMessage {
  id: string; // Always a client-side unique string ID for *ngFor keys
  dbMessageId?: number; // Actual database ID for bot messages (used for feedback)
  sender: 'user' | 'bot';
  type: 'text' | 'productInfo' | 'productComparison' | 'productPromotion';
  content: any;
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
}

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
  messages: ComponentChatMessage[] = []; // Uses local ComponentChatMessage
  isBotResponding: boolean = false;
  private messageSubscription: Subscription | null = null;
  private sessionDetailsSubscription: Subscription | null = null;

  userName: string = '';
  userPhoneNumber: string = '';
  authError: string | null = null;
  isLoadingAuth: boolean = false;

  private currentSessionId: number | undefined = undefined;
  private currentSessionToken: string | undefined = undefined;
  retrievedTenantId: number | null = 1; // Default to null, ensure it's set

  @ViewChild('chatBox') chatBoxRef!: ElementRef;

  showDislikeModal = false;
  dislikeReason = '';
  messageToDislike: ComponentChatMessage | null = null;
  feedbackError: string | null = null;
  feedbackSuccessMessage: string | null = null;

  private feedbackService = inject(FeedbackService);
  private socketService = inject(SocketService);
  private http = inject(HttpClient);
  private cdRef = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    console.log('>>> WidgetUserComponent CONSTRUCTOR running');
  }

  ngOnInit(): void {
    console.log('>>> WidgetUserComponent ngOnInit running');
    this.retrieveTenantIdFromScript();

    if (this.messages.length === 0) {
      this.messages = [
        {
          id: this.generateId(),
          sender: 'bot',
          type: 'text',
          content: 'Xin chào! Bạn cần InsightIQ hỗ trợ về sản phẩm nào ạ?',
          timestamp: new Date(),
          liked: false,
          disliked: false,
        },
      ];
    }

    this.messageSubscription?.unsubscribe();
    this.sessionDetailsSubscription?.unsubscribe();

    this.messageSubscription = this.socketService
      .listenForNewMessages()
      .subscribe({
        next: (botMsgFromService: ServiceChatMessage) => {
          console.log(
            '>>> WidgetUserComponent: Received message from service:',
            botMsgFromService
          );
          const finalMessage: ComponentChatMessage = {
            id: this.generateId(), // Client-side unique string ID
            dbMessageId: botMsgFromService.dbMessageId, // Numeric DB ID from service
            sender: botMsgFromService.sender,
            type: botMsgFromService.type,
            content: botMsgFromService.content,
            timestamp: new Date(botMsgFromService.timestamp), // Ensure it's a Date object
            liked: botMsgFromService.liked ?? false,
            disliked: botMsgFromService.disliked ?? false,
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

    this.sessionDetailsSubscription = this.socketService
      .listenForSessionDetails()
      .subscribe((details) => {
        console.log(
          '>>> WidgetUserComponent: Received session details',
          details
        );
        if (details.sessionId) this.currentSessionId = details.sessionId;
        if (details.sessionToken)
          this.currentSessionToken = details.sessionToken;
      });
  }

  retrieveTenantIdFromScript(): void {
    if (isPlatformBrowser(this.platformId)) {
      const scriptTag = document.getElementById(
        'chatbot-script'
      ) as HTMLScriptElement;
      if (scriptTag && scriptTag.dataset['tenantId']) {
        const tenantIdNum = parseInt(scriptTag.dataset['tenantId'], 10);
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
          // Check if still null
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
    this.messageSubscription?.unsubscribe();
    this.sessionDetailsSubscription?.unsubscribe();
    if (this.socketService) {
      this.socketService.disconnect();
    }
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
      this.isLoadingAuth = false;
      this.cdRef.detectChanges();
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
        tap(() => this.completeAuthentication()),
        catchError((loginError) => {
          if (loginError.status === 400 || loginError.status === 401) {
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
            // Only update error if auth process hasn't completed
            this.authError =
              this.authError ||
              finalError.error?.message ||
              'Đã có lỗi xảy ra. Vui lòng thử lại.';
            this.isLoadingAuth = false;
            this.cdRef.detectChanges();
          }
          console.error('>>> Final error in processStartChat:', finalError);
        },
      });
  }

  private attemptSignUpAndLogin() {
    if (this.retrievedTenantId === null) {
      // Should be caught by caller, but good for safety
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
        switchMap(() => {
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
        tap(() => this.completeAuthentication()),
        catchError((error) => {
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
    if (this.socketService) this.socketService.connect();
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
      const userMessage: ComponentChatMessage = {
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
      if (textarea) textarea.style.height = 'auto';

      this.isBotResponding = true;
      this.cdRef.detectChanges();
      this.scrollToBottomIfNeeded();

      if (typeof this.retrievedTenantId !== 'number') {
        this.isBotResponding = false;
        this.messages.push({
          id: this.generateId(),
          sender: 'bot',
          type: 'text',
          content: 'Lỗi: Không thể gửi tin nhắn do thiếu Tenant ID.',
          timestamp: new Date(),
        });
        this.cdRef.detectChanges();
        this.scrollToBottomIfNeeded();
        return;
      }
      const dataToSend = {
        text,
        tenantId: this.retrievedTenantId,
        sessionId: this.currentSessionId,
        sessionToken: this.currentSessionToken,
      };
      this.socketService.sendMessage(dataToSend);
    }
  }

  scrollToBottom(): void {
    if (this.chatBoxRef?.nativeElement) {
      this.chatBoxRef.nativeElement.scrollTop =
        this.chatBoxRef.nativeElement.scrollHeight;
    }
  }

  scrollToBottomIfNeeded(): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.ngZone.run(() => this.scrollToBottom()), 0);
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
    this.cdRef.detectChanges();
    this.scrollToBottomIfNeeded();
  }

  stopBotResponse(): void {
    this.isBotResponding = false;
    this.cdRef.detectChanges();
  }

  renderMarkdownBold(text: any): string {
    return typeof text === 'string'
      ? text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      : '';
  }

  trackByMessageId(index: number, message: ComponentChatMessage): string {
    return message.id; // Always use the client-side unique string ID for trackBy
  }

  handleLike(message: ComponentChatMessage): void {
    if (message.dbMessageId === undefined) return;
    message.liked = !message.liked;
    if (message.liked) message.disliked = false;
    this.clearFeedbackMessages();
    this.cdRef.detectChanges();

    if (message.liked) {
      const payload: FeedbackPayload = {
        messageId: message.dbMessageId,
        rating: Rating.Positive,
      };
      this.submitFeedbackToServer(payload, message, 'Message Liked!');
    } else {
      // Optional: To "unlike" and remove from DB, backend needs to support it.
      // For now, this only updates UI if backend doesn't have "remove positive feedback" logic.
      // The backend "update or create" will turn this into a "Negative" if it was the only option.
      // To truly "remove" a like, a different backend approach is needed (e.g. delete feedback by messageId)
      // Or, send a specific "NEUTRAL" rating if backend supports it.
      console.log(`Message ${message.dbMessageId} unliked. UI updated.`);
    }
  }

  handleDislike(message: ComponentChatMessage): void {
    if (message.dbMessageId === undefined) return;
    message.disliked = !message.disliked; // Toggle dislike state
    if (message.disliked) {
      message.liked = false;
      this.messageToDislike = message;
      this.dislikeReason = '';
      this.showDislikeModal = true;
    } else {
      // User is "un-disliking"
      this.clearFeedbackMessages();
      console.log(`Message ${message.dbMessageId} un-disliked (UI only).`);
      // Similar to "unlike", removing/neutralizing negative feedback would need backend support.
    }
    this.cdRef.detectChanges();
  }

  closeDislikeModal(): void {
    // If modal is cancelled, revert optimistic dislike if no successful submission for this instance
    if (this.messageToDislike && this.messageToDislike.disliked) {
      const wasSuccessfullySubmitted =
        this.feedbackSuccessMessage && this.messageToDislike.dbMessageId
          ? this.feedbackSuccessMessage.includes(
              this.messageToDislike.dbMessageId.toString()
            )
          : false;

      if (!wasSuccessfullySubmitted) {
        this.messageToDislike.disliked = false; // Revert UI
      }
    }
    this.showDislikeModal = false;
    this.messageToDislike = null;
    this.dislikeReason = '';
    this.clearFeedbackMessages(); // Clear any pending error/success from modal context
    this.cdRef.detectChanges();
  }

  submitDislikeReason(): void {
    if (
      !this.messageToDislike ||
      this.messageToDislike.dbMessageId === undefined
    )
      return;
    const payload: FeedbackPayload = {
      messageId: this.messageToDislike.dbMessageId,
      rating: Rating.Negative,
      comment: this.dislikeReason.trim() || undefined,
    };
    this.submitFeedbackToServer(
      payload,
      this.messageToDislike,
      `Feedback submitted.`
    );
    this.showDislikeModal = false; // Close modal after initiating submission
    // messageToDislike.disliked is already true from handleDislike method
  }

  private submitFeedbackToServer(
    payload: FeedbackPayload,
    message: ComponentChatMessage,
    successMsg: string
  ): void {
    this.isLoadingAuth = true; // Use general loading flag
    this.feedbackError = null;
    this.feedbackSuccessMessage = null;

    this.feedbackService.submitFeedback(payload).subscribe({
      next: () => {
        // Ensure UI is consistent with backend (it should be due to backend's update/create logic)
        if (payload.rating === Rating.Positive) {
          message.liked = true;
          message.disliked = false;
        } else if (payload.rating === Rating.Negative) {
          message.disliked = true;
          message.liked = false;
        }
        this.feedbackSuccessMessage = successMsg;
        this.isLoadingAuth = false;
        this.cdRef.detectChanges();
        setTimeout(() => {
          this.feedbackSuccessMessage = null;
          this.cdRef.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.feedbackError = err.message || 'Could not submit feedback.';
        // Revert optimistic UI if submission fails
        // This can be complex; for simplicity, show error, user might need to retry toggle
        if (payload.rating === Rating.Positive) message.liked = false;
        // If it was a dislike, the 'disliked' flag was already set.
        // Setting it to false here might be incorrect if the user *intended* to dislike.
        // else if (payload.rating === Rating.Negative) message.disliked = false; // Reconsider this revert

        this.isLoadingAuth = false;
        this.cdRef.detectChanges();
      },
    });
  }

  private clearFeedbackMessages(): void {
    this.feedbackError = null;
    this.feedbackSuccessMessage = null;
  }
}
