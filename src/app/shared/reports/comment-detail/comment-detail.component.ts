// InsightIQ FE BE/FrontEnd/shared/reports/comment-detail/comment-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Added Router
import { Location, CommonModule, DatePipe } from '@angular/common'; // Added DatePipe
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Added HttpClient, HttpErrorResponse
import { forkJoin, of } from 'rxjs'; // Added forkJoin, of
import { switchMap, catchError, map } from 'rxjs/operators'; // Added switchMap, catchError, map

// Interfaces (define these here or import from a shared file)
interface MessageDetailDto {
  id: number;
  sender: string; // 'User' | 'Chatbot' from backend
  content: string;
  chatSessionId: number;
  createdAt: string;
}

interface ChatMessageDto {
  id: number;
  sender: string; // 'User' | 'Chatbot' from backend
  content: string;
  chatSessionId: number;
  createdAt: string;
}

export interface DisplayChatMessage {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isDisliked?: boolean;
}

@Component({
  selector: 'app-comment-detail',
  standalone: true,
  imports: [CommonModule, DatePipe], // Make sure DatePipe is here
  templateUrl: './comment-detail.component.html',
  styleUrls: ['./comment-detail.component.css'],
})
export class CommentDetailComponent implements OnInit {
  conversationSnippet: DisplayChatMessage[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  dislikedMessageId: number | null = null; // Changed from commentId to reflect it's a message ID
  originalCommentText: string | null = null; // You might want to fetch this too if needed

  private apiBaseUrl = 'http://localhost:3001'; // Your backend API base URL

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private location: Location,
    private router: Router // Injected Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.dislikedMessageId = +idParam; // Convert string param to number
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

    // Step 1: Fetch the disliked message to get its chatSessionId
    this.http
      .get<MessageDetailDto>(
        `${this.apiBaseUrl}/message/detail/${dislikedMsgId}`,
        { withCredentials: true }
      )
      .pipe(
        switchMap((messageDetail) => {
          if (
            !messageDetail ||
            typeof messageDetail.chatSessionId !== 'number'
          ) {
            throw new Error(
              'Chat session ID not found or invalid for the disliked message.'
            );
          }
          // Store original comment text if you need it (e.g., to display what the user initially wrote as feedback)
          // this.originalCommentText = "Fetch this from feedback details if needed"; // Placeholder
          console.log(
            `Workspaceed disliked message detail, chatSessionId: ${messageDetail.chatSessionId}`
          );
          // Step 2: Fetch all messages for that chatSessionId
          return this.http.get<ChatMessageDto[]>(
            `${this.apiBaseUrl}/message/${messageDetail.chatSessionId}`,
            { withCredentials: true }
          );
        }),
        map((allMessages) => {
          // Step 3: Process messages to create the snippet
          const dislikedMessageIndex = allMessages.findIndex(
            (msg) => msg.id === dislikedMsgId
          );
          if (dislikedMessageIndex === -1) {
            // Should not happen if step 1 succeeded with the same ID, but good for robustness
            throw new Error(
              'Disliked message not found in the session conversation.'
            );
          }

          const snippetRange = 2; // Show 2 messages before and 2 after
          const startIndex = Math.max(0, dislikedMessageIndex - snippetRange);
          const endIndex = Math.min(
            allMessages.length - 1,
            dislikedMessageIndex + snippetRange
          );

          const snippetDto = allMessages.slice(startIndex, endIndex + 1);

          return snippetDto.map((dto) => ({
            id: dto.id,
            sender: dto.sender.toLowerCase() as 'user' | 'bot', // Normalize sender
            text: dto.content,
            timestamp: new Date(dto.createdAt),
            isDisliked: dto.id === dislikedMsgId,
          }));
        }),
        catchError((err: HttpErrorResponse | Error) => {
          console.error('Error loading conversation snippet:', err);
          let message = 'Failed to load conversation details.';
          if (err instanceof HttpErrorResponse) {
            message = err.error?.message || err.message || message;
          } else if (err instanceof Error) {
            message = err.message;
          }
          this.handleError(message);
          return of([]); // Return an empty array on error to prevent breaking the chain
        })
      )
      .subscribe((snippet) => {
        this.conversationSnippet = snippet;
        this.isLoading = false;
        if (snippet.length === 0 && !this.errorMessage) {
          // This case can happen if the try/catchError returns of([]) successfully
          // but the logic before that (e.g. map) resulted in no items.
          this.errorMessage = 'No conversation data to display.';
        }
      });
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    this.isLoading = false;
    this.conversationSnippet = [];
  }

  goBack(): void {
    // Check if there's a previous location in history
    if (window.history.length > 1) {
      this.location.back();
    } else {
      // Otherwise, navigate to a default route (e.g., reports list)
      // Adjust the fallback route as per your application structure
      this.router.navigate(['/viewreport']);
    }
  }
}
