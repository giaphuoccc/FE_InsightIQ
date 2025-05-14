// gemini_fn/FrontEnd/shared/reports/comment-detail/comment-detail.component.ts
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location, CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { switchMap, catchError, map, finalize } from 'rxjs/operators';

// Import structured content display components
import { ProductInfoComponent } from '../../../components/widget-user/product-info/product-info.component';
import { ProductComparisonComponent } from '../../../components/widget-user/product-comparison/product-comparison.component';
import { ProductPromotionComponent } from '../../../components/widget-user/product-promotion/product-promotion.component';

// Interface for data fetched from /message/detail/:id (the disliked message)
interface MessageDetailDto {
  id: number;
  sender: string; // 'User' | 'Chatbot' from backend
  content: string; // This will be the string (plain or JSON string)
  type: string; // Type of the message (e.g., 'text', 'productInfo')
  chatSessionId: number;
  createdAt: string;
}

// Interface for data fetched from /message/:chatSessionId (all messages in session)
interface ChatMessageDto {
  id: number;
  sender: string; // 'User' | 'Chatbot' from backend
  content: string; // This will be the string (plain or JSON string)
  type: string; // Type of the message
  chatSessionId: number;
  createdAt: string;
}

// Interface for messages prepared for display in the template
export interface DisplayChatMessage {
  id: number;
  sender: 'user' | 'bot';
  content: any; // Changed from 'text: string' to 'content: any' to hold parsed objects or strings
  type:
    | 'text'
    | 'productInfo'
    | 'productComparison'
    | 'productPromotion'
    | string; // Added type, ensure it covers all backend types
  timestamp: Date;
  isDisliked?: boolean;
}

@Component({
  selector: 'app-comment-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ProductInfoComponent,
    ProductComparisonComponent,
    ProductPromotionComponent,
  ],
  templateUrl: './comment-detail.component.html',
  styleUrls: ['./comment-detail.component.css'],
})
export class CommentDetailComponent implements OnInit {
  conversationSnippet: DisplayChatMessage[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  dislikedMessageId: number | null = null;

  private apiBaseUrl = 'http://localhost:3001';
  private cdRef = inject(ChangeDetectorRef);

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.dislikedMessageId = +idParam;
      if (!isNaN(this.dislikedMessageId)) {
        this.loadConversationSnippet(this.dislikedMessageId);
      } else {
        this.handleError('Invalid message ID provided.');
      }
    } else {
      this.handleError('No message ID found in route.');
    }
  }

  private loadConversationSnippet(dislikedMsgId: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.conversationSnippet = [];

    this.http
      .get<MessageDetailDto>(
        `${this.apiBaseUrl}/message/detail/${dislikedMsgId}`,
        { withCredentials: true }
      )
      .pipe(
        switchMap((messageDetail) => {
          if (
            !messageDetail ||
            typeof messageDetail.chatSessionId !== 'number' ||
            !messageDetail.type
          ) {
            console.error('Invalid message detail received:', messageDetail);
            throw new Error(
              'Chat session ID or message type not found or invalid for the disliked message.'
            );
          }
          console.log(
            `Workspaceed disliked message detail, chatSessionId: ${messageDetail.chatSessionId}, type: ${messageDetail.type}`
          );
          return this.http.get<ChatMessageDto[]>(
            `${this.apiBaseUrl}/message/${messageDetail.chatSessionId}`,
            { withCredentials: true }
          );
        }),
        map((allMessages: ChatMessageDto[]) => {
          const dislikedMessageIndex = allMessages.findIndex(
            (msg) => msg.id === dislikedMsgId
          );
          if (dislikedMessageIndex === -1) {
            throw new Error(
              'Disliked message not found in the session conversation.'
            );
          }

          const snippetRange = 2; // Number of messages before and after the disliked one
          const startIndex = Math.max(0, dislikedMessageIndex - snippetRange);
          const endIndex = Math.min(
            allMessages.length - 1,
            dislikedMessageIndex + snippetRange
          );
          const snippetDto = allMessages.slice(startIndex, endIndex + 1);

          return snippetDto.map((dto: ChatMessageDto) => {
            let parsedContent: any = dto.content;
            const messageType = (
              dto.type || 'text'
            ).toLowerCase() as DisplayChatMessage['type'];

            if (messageType !== 'text' && typeof dto.content === 'string') {
              try {
                parsedContent = JSON.parse(dto.content);
              } catch (e) {
                console.error(
                  `Failed to parse content for message ID ${dto.id} of type ${messageType}:`,
                  e,
                  '\nRaw Content:',
                  dto.content
                );
                // Fallback: use the original string content if parsing fails
                parsedContent = dto.content;
                // Optionally, you might want to force the type to 'text' here if parsing fails
                // messageType = 'text';
              }
            }

            return {
              id: dto.id,
              sender: dto.sender.toLowerCase() as 'user' | 'bot',
              content: parsedContent,
              type: messageType,
              timestamp: new Date(dto.createdAt),
              isDisliked: dto.id === dislikedMsgId,
            };
          });
        }),
        catchError((err: HttpErrorResponse | Error) => {
          console.error('Error loading conversation snippet:', err);
          let message = 'Failed to load conversation details.';
          if (err instanceof HttpErrorResponse) {
            message = `Server error ${err.status}: ${
              err.error?.message || err.message
            }`;
          } else if (err instanceof Error) {
            message = err.message;
          }
          this.handleError(message);
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe((snippet: DisplayChatMessage[]) => {
        this.conversationSnippet = snippet;
        if (snippet.length === 0 && !this.errorMessage) {
          this.errorMessage = 'No conversation data to display.';
        }
        this.cdRef.detectChanges();
      });
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    this.isLoading = false;
    this.conversationSnippet = [];
    this.cdRef.detectChanges();
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/viewreport']); // Default fallback
    }
  }
}
