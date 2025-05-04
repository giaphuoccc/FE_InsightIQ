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

// Import child components and service
import { ProductInfoComponent } from './product-info/product-info.component';
import { ProductComparisonComponent } from './product-comparison/product-comparison.component';
import { ProductPromotionComponent } from './product-promotion/product-promotion.component';
import { SocketService } from '../../core/chatBot/socket.service'; // Ensure path is correct

// --- Define ChatMessage Interface ---
// Content can now be string or specific object types
export interface ChatMessage {
  id?: string; // Optional ID, useful for feedback
  sender: 'user' | 'bot';
  type: 'text' | 'productInfo' | 'productComparison' | 'productPromotion'; // Add other types if needed
  content: any; // Can be string or object (ProductDataDto, ProductComparisonDataDto, etc.)
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
}

// --- NOTE: ProductData and ProductComparisonData interfaces are NO LONGER NEEDED HERE ---
// --- They should be defined in the respective child components (ProductInfoComponent, ProductComparisonComponent) ---
// --- Or kept in a shared types file if used elsewhere. ---

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
  // --- Component Properties ---
  showChatbox = false;
  isChatting = false;
  messageText: string = '';
  messages: ChatMessage[] = [];
  isBotResponding: boolean = false;
  private messageSubscription: Subscription | null = null;

  // Session info (EXAMPLE - GET FROM ACTUAL SOURCE)
  private currentSessionId: number | undefined = undefined;
  private currentSessionToken: string | undefined = undefined;
  private currentTenantId: number = 1; // GET FROM ACTUAL SOURCE

  @ViewChild('chatBox') chatBoxRef!: ElementRef;

  // --- Constructor ---
  constructor(
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private socketService: SocketService // Inject SocketService
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

    // Unsubscribe from previous subscription if it exists
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    // Subscribe to new messages from the SocketService
    this.messageSubscription = this.socketService
      .listenForNewMessages()
      .subscribe({
        next: (botMessage: ChatMessage) => {
          // --- NO MORE PARSING NEEDED HERE ---
          console.log(
            '>>> WidgetUserComponent: Received message from service:',
            botMessage
          );
          console.log('>>> Message Content Type:', typeof botMessage.content);
          console.log('>>> Message Content Value:', botMessage.content);

          // Directly use the received message structure
          const finalMessage: ChatMessage = {
            ...botMessage,
            // Ensure timestamp is a Date object
            timestamp: botMessage.timestamp
              ? new Date(botMessage.timestamp)
              : new Date(),
            // Set default like/dislike state if not provided
            liked: botMessage.liked ?? false,
            disliked: botMessage.disliked ?? false,
            // Assign a unique ID if the backend didn't provide one (useful for feedback)
            id: botMessage.id ?? this.generateId(),
          };

          // Add the message to the display array
          this.messages.push(finalMessage);
          this.isBotResponding = false; // Bot has responded
          this.cdRef.detectChanges(); // Trigger change detection
          this.scrollToBottomIfNeeded(); // Scroll to the new message
        },
        error: (err: any) => {
          console.error(
            '>>> WidgetUserComponent: Error receiving message:',
            err
          );
          this.isBotResponding = false;
          // Add an error message to the chat
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

    // Listen for session details updates from the backend (if applicable)
    this.socketService.listenForSessionDetails().subscribe((details) => {
      console.log('>>> WidgetUserComponent: Received session details', details);
      if (details.sessionId) this.currentSessionId = details.sessionId;
      if (details.sessionToken) this.currentSessionToken = details.sessionToken;
      // Optionally save to local storage/session storage
    });
  }

  ngAfterViewInit(): void {
    // Scroll to bottom when chat becomes visible
    if (this.isChatting && this.showChatbox) {
      this.scrollToBottomIfNeeded();
    }
  }

  ngOnDestroy(): void {
    console.log('>>> WidgetUserComponent ngOnDestroy');
    // Unsubscribe from observables to prevent memory leaks
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }
    // Disconnect the socket when the component is destroyed
    this.socketService.disconnect();
  }

  // --- Event Handlers and Other Methods ---

  toggleChatbox(): void {
    this.showChatbox = !this.showChatbox;
    if (this.showChatbox && this.isChatting) {
      // Use setTimeout to ensure the element is visible before scrolling
      setTimeout(() => this.scrollToBottomIfNeeded(), 0);
    }
  }

  startChat(): void {
    this.isChatting = true;
    console.log('Chat started. Attempting to connect/reconnect socket.');
    // Ensure socket connection is established when chat starts
    this.socketService.connect(); // Make sure connect method exists and handles reconnection

    // TODO: Implement logic to retrieve existing session ID/Token from storage
    // if (!this.currentSessionId) {
    //   const storedSession = /* get from localStorage/sessionStorage */ ;
    //   if (storedSession) {
    //      this.currentSessionId = storedSession.id;
    //      this.currentSessionToken = storedSession.token;
    //   }
    // }
    console.log(
      `Current session info - ID: ${this.currentSessionId}, Token: ${this.currentSessionToken}, Tenant: ${this.currentTenantId}`
    );
    setTimeout(() => this.scrollToBottomIfNeeded(), 0);
  }

  autoExpand(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = textarea.scrollHeight + 'px'; // Set to content height
  }

  handleKeyDown(event: KeyboardEvent): void {
    // Send message on Enter key (unless Shift is pressed)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default newline behavior
      this.onSendMessage();
    }
  }

  onSendMessage(): void {
    const text = this.messageText.trim();
    // Check if there's text and the socket service is available
    if (text && this.socketService) {
      // Create the user message object
      const userMessage: ChatMessage = {
        id: this.generateId(), // Generate a temporary ID for the user message
        sender: 'user',
        type: 'text',
        content: text,
        timestamp: new Date(),
      };
      this.messages.push(userMessage); // Add user message to the display
      this.messageText = ''; // Clear the input field

      // Reset textarea height after sending
      const textarea = document.querySelector(
        '.message-input .chat-input'
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto'; // Or set to a specific min-height
      }

      this.isBotResponding = true; // Show bot responding indicator
      this.cdRef.detectChanges(); // Update the view
      this.scrollToBottomIfNeeded(); // Scroll down

      // Prepare data to send via socket
      const tenantIdToSend = this.currentTenantId;
      const sessionIdToSend = this.currentSessionId;
      const sessionTokenToSend = this.currentSessionToken;

      // Basic validation: Ensure tenant ID is present
      if (typeof tenantIdToSend === 'undefined' || tenantIdToSend === null) {
        console.error(
          '>>> WidgetUserComponent: Tenant ID is missing! Cannot send message.'
        );
        this.isBotResponding = false;
        // Display an error message in the chat
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
        return; // Stop execution
      }

      const dataToSend = {
        text: text,
        tenantId: tenantIdToSend,
        sessionId: sessionIdToSend, // Send undefined if no session yet
        sessionToken: sessionTokenToSend, // Send undefined if no session yet
      };

      console.log(
        '>>> WidgetUserComponent: Sending message via socket',
        dataToSend
      );
      // Send the message using the SocketService
      this.socketService.sendMessage(dataToSend);
    }
  }

  scrollToBottom(): void {
    // Scrolls the chatbox to the bottom
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
    // Ensures scrolling happens after the view updates
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.scrollToBottom();
        });
      }, 0); // Timeout ensures it runs after the current digest cycle
    });
  }

  generateId(): string {
    // Simple ID generator
    return Math.random().toString(36).substring(2, 15);
  }

  clearChat(): void {
    // Resets the chat to the initial state
    this.messages = [
      {
        id: this.generateId(),
        sender: 'bot',
        type: 'text',
        content: 'Chào bạn, InsightIQ có thể giúp gì cho bạn?',
        timestamp: new Date(),
      },
    ];
    // Consider resetting session ID/token if clearing implies starting fresh
    // this.currentSessionId = undefined;
    // this.currentSessionToken = undefined;
    console.log('Chat cleared.');
    this.cdRef.detectChanges();
    this.scrollToBottomIfNeeded();
  }

  toggleLike(msg: ChatMessage): void {
    if (!msg.id) return; // Need message ID for feedback
    msg.liked = !msg.liked;
    if (msg.liked) msg.disliked = false; // Can't like and dislike
    console.log(`Message ${msg.id} Liked: ${msg.liked}`);
    // TODO: Send feedback to server via SocketService
    // this.socketService.sendFeedback({ messageId: msg.id, rating: msg.liked ? 'Positive' : null, comment: '' });
    this.cdRef.detectChanges();
  }

  toggleDislike(msg: ChatMessage): void {
    if (!msg.id) return; // Need message ID for feedback
    msg.disliked = !msg.disliked;
    if (msg.disliked) msg.liked = false; // Can't like and dislike
    console.log(`Message ${msg.id} Disliked: ${msg.disliked}`);
    // TODO: Send feedback to server via SocketService
    // this.socketService.sendFeedback({ messageId: msg.id, rating: msg.disliked ? 'Negative' : null, comment: '' });
    this.cdRef.detectChanges();
  }

  stopBotResponse(): void {
    console.log(
      '>>> WidgetUserComponent: Stop bot response requested by user.'
    );
    // TODO: Implement logic to signal the backend to stop processing via SocketService
    // this.socketService.cancelCurrentRequest(); // Example method name
    this.isBotResponding = false; // Immediately update UI
    this.cdRef.detectChanges();
  }

  // --- REMOVED PARSING FUNCTIONS ---
  // private parseProductInfoContent(content: string): Partial<ProductData> { ... }
  // private parseProductComparisonContent(content: string): ProductComparisonData { ... }

  // --- RENDER MARKDOWN BOLD (for text messages) ---
  renderMarkdownBold(text: any): string {
    // Only apply to strings
    if (typeof text !== 'string') {
      // If content is an object, return empty string or handle differently
      return '';
    }
    // Replace **text** with <strong>text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }
}
