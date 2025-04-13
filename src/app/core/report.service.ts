import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // Import 'of' for creating observables from mock data

// --- Interfaces (Keep or import these definitions) ---
export interface ReportStats {
  likes: number;
  dislikes: number;
  responseTime: number; // Assuming seconds
  stops: number;
  chatTime: number; // Assuming total seconds for all chats
  rateOutOfRange: number; // Count of ratings outside a defined range (e.g., 1-5)
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string; // ISO 8601 format recommended (e.g., '2023-10-27T10:30:00Z')
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isDisliked?: boolean; // Optional flag for user disliked bot messages
  timestamp: string; // ISO 8601 format recommended
}
// --- End Interfaces ---

// --- MOCK DATA DEFINITIONS ---
const MOCK_STATS: ReportStats = {
  likes: 125,
  dislikes: 15,
  responseTime: 2.5, // Average response time in seconds
  stops: 5, // Number of times users stopped the chat explicitly
  chatTime: 3500, // Total chat time in seconds across relevant sessions
  rateOutOfRange: 2, // Number of invalid rating attempts
};

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    text: 'The bot was really helpful in explaining the process.',
    timestamp: '2024-04-10T09:15:00Z',
  },
  {
    id: 'c2',
    text: "It didn't understand my specific question about edge case X.",
    timestamp: '2024-04-10T11:30:00Z',
  },
  {
    id: 'c3',
    text: 'Quick response, thanks!',
    timestamp: '2024-04-11T08:05:00Z',
  },
  {
    id: 'c4',
    text: 'Could be improved with more examples.',
    timestamp: '2024-04-11T14:20:00Z',
  },
];

// Mock chat detail, e.g., for comment 'c2'
const MOCK_CHAT_DETAIL_C2: ChatMessage[] = [
  {
    id: 'msg1',
    sender: 'user',
    text: 'Hi, I need help with my account.',
    timestamp: '2024-04-10T11:25:00Z',
  },
  {
    id: 'msg2',
    sender: 'bot',
    text: 'Hello! How can I assist you with your account today?',
    timestamp: '2024-04-10T11:25:05Z',
  },
  {
    id: 'msg3',
    sender: 'user',
    text: 'What happens in edge case X regarding billing?',
    timestamp: '2024-04-10T11:26:10Z',
  },
  {
    id: 'msg4',
    sender: 'bot',
    text: 'I can help with general billing questions. For specific edge cases, please refer to our documentation or contact support.',
    isDisliked: true, // User disliked this response
    timestamp: '2024-04-10T11:26:45Z',
  },
  {
    id: 'msg5',
    sender: 'user',
    text: "Okay, that's not very helpful for my specific problem.",
    timestamp: '2024-04-10T11:27:15Z',
  },
  // ... more messages
];
// --- END MOCK DATA DEFINITIONS ---

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  // --- Option 2: Base URL + Specific Paths ---
  // Replace with the actual planned Base URL when known
  private baseApiUrl = 'https://your-api.com/api/reports'; // Kept for reference

  // Define specific paths relative to the baseApiUrl
  private statsPath = '/statistics';
  private commentsPath = '/comments';
  // Define the suffix for the chat detail relative to a comment ID path
  private chatDetailPathSuffix = '/chat';
  // --- End API Endpoint Definitions ---

  // Inject HttpClient - Still needed if you plan to switch back
  constructor(private http: HttpClient) {}

  /**
   * Fetches report statistics. Returns MOCK DATA.
   * NOTE: Ignores startDate and endDate for mock implementation.
   * @param startDate Optional start date string (ignored in mock)
   * @param endDate Optional end date string (ignored in mock)
   * @returns Observable<ReportStats>
   */
  getStatistics(startDate?: string, endDate?: string): Observable<ReportStats> {
    console.log(
      `SERVICE: Requesting Stats (MOCK) - Ignoring dates: ${startDate}, ${endDate}`
    );

    // --- MOCK IMPLEMENTATION ---
    return of(MOCK_STATS);
    // --- END MOCK IMPLEMENTATION ---

    /* --- ORIGINAL HTTP IMPLEMENTATION ---
    const fullUrl = `${this.baseApiUrl}${this.statsPath}`;
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    console.log(`SERVICE: Requesting Stats from ${fullUrl} with params: ${params.toString()}`);
    return this.http.get<ReportStats>(fullUrl, { params });
    */ // --- END ORIGINAL HTTP IMPLEMENTATION ---
  }

  /**
   * Fetches comments. Returns MOCK DATA.
   * NOTE: Ignores startDate and endDate for mock implementation.
   * @param startDate Optional start date string (ignored in mock)
   * @param endDate Optional end date string (ignored in mock)
   * @returns Observable<Comment[]>
   */
  getComments(startDate?: string, endDate?: string): Observable<Comment[]> {
    console.log(
      `SERVICE: Requesting Comments (MOCK) - Ignoring dates: ${startDate}, ${endDate}`
    );

    // --- MOCK IMPLEMENTATION ---
    // You could add basic date filtering here if needed, but keeping it simple:
    // const filteredComments = MOCK_COMMENTS.filter(c => {
    //   const ts = new Date(c.timestamp).getTime();
    //   const start = startDate ? new Date(startDate).getTime() : 0;
    //   const end = endDate ? new Date(endDate).getTime() : Infinity;
    //   return ts >= start && ts <= end;
    // });
    // return of(filteredComments);
    return of(MOCK_COMMENTS); // Return all mock comments
    // --- END MOCK IMPLEMENTATION ---

    /* --- ORIGINAL HTTP IMPLEMENTATION ---
    const fullUrl = `${this.baseApiUrl}${this.commentsPath}`;
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    console.log(`SERVICE: Requesting Comments from ${fullUrl} with params: ${params.toString()}`);
    return this.http.get<Comment[]>(fullUrl, { params });
    */ // --- END ORIGINAL HTTP IMPLEMENTATION ---
  }

  /**
   * Fetches the detailed chat log for a specific comment. Returns MOCK DATA.
   * NOTE: Returns the same chat log regardless of commentId for this simple mock.
   * @param commentId The ID of the comment (ignored in this simple mock)
   * @returns Observable<ChatMessage[]>
   */
  getChatDetail(commentId: string): Observable<ChatMessage[]> {
    console.log(
      `SERVICE: Requesting Chat Detail (MOCK) for commentId: ${commentId} (returning fixed data)`
    );

    // --- MOCK IMPLEMENTATION ---
    // For a more complex mock, you could use a switch or map based on commentId
    // switch(commentId) {
    //   case 'c2': return of(MOCK_CHAT_DETAIL_C2);
    //   // Add cases for other comment IDs if needed
    //   default: return of([]); // Return empty array if no specific mock chat exists
    // }
    return of(MOCK_CHAT_DETAIL_C2); // Return the mock chat for 'c2' always
    // --- END MOCK IMPLEMENTATION ---

    /* --- ORIGINAL HTTP IMPLEMENTATION ---
    const fullUrl = `${this.baseApiUrl}${this.commentsPath}/${commentId}${this.chatDetailPathSuffix}`;
    console.log(`SERVICE: Requesting Chat Detail from ${fullUrl}`);
    return this.http.get<ChatMessage[]>(fullUrl);
    */ // --- END ORIGINAL HTTP IMPLEMENTATION ---
  }
}
