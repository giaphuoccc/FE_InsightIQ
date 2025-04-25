// --- Định nghĩa interface cho tin nhắn ---
import { ProductPromotionData } from './product-promotion/product-promotion.component';
//import { SocketService } from 'src/app/core/ChatBot Service/socket.service';
import { SocketService } from '../../core/ChatBot Service/socket.service';
import { Subscription } from 'rxjs';

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

  @ViewChild('chatBox') chatBoxRef!: ElementRef;

  constructor(
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.messages = [
      {
        id: this.generateId(),
        sender: 'bot',
        type: 'text',
        content: 'Xin chào! Bạn muốn hỏi về sản phẩm nào ạ?',
        timestamp: new Date()
      }
    ];

    this.socketService.connect();

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    this.messageSubscription = this.socketService.listenForMessages().subscribe({
      next: (botMessage: ChatMessage) => {
        this.messages.push(botMessage);
        this.isBotResponding = false;
        this.cdRef.detectChanges();
        this.scrollToBottomIfNeeded();
      },
      error: (err) => {
        console.error('Lỗi khi nhận tin nhắn từ bot:', err);
        this.isBotResponding = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.isChatting && this.showChatbox) {
      this.scrollToBottomIfNeeded();
    }
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
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
    if (text) {
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

      this.isBotResponding = true;
      this.cdRef.detectChanges();
      this.scrollToBottomIfNeeded();

      const dataToSend = { text };
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

    this.cdRef.detectChanges();
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    });
  }

  toggleLike(msg: ChatMessage): void {
    msg.liked = !msg.liked;
    if (msg.liked) msg.disliked = false;
  }

  toggleDislike(msg: ChatMessage): void {
    msg.disliked = !msg.disliked;
    if (msg.disliked) msg.liked = false;
  }

  stopBotResponse(): void {
    this.socketService.cancelCurrentStream(); // <- gọi tới mock service
    this.isBotResponding = false;
    this.cdRef.detectChanges();
  }
  
}
