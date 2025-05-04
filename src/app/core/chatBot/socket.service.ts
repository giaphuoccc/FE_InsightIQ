// src/app/core/chatBotService/socket.service.ts

// Import necessary Angular and RxJS modules
import { Injectable, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, BehaviorSubject } from 'rxjs'; // Import BehaviorSubject if needed for initial status
import { ChatMessage } from '../../components/widget-user/widget-user.component'; // Ensure path is correct
import { io, Socket } from 'socket.io-client';

// Interface for session details payload
export interface SessionDetails {
  sessionId: number;
  sessionToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  // Socket instance - Use '!' to assure TypeScript it will be initialized in browser context
  private socket!: Socket;

  // Subjects to manage Observables for different events
  private newMessageSubject = new Subject<ChatMessage>();
  // Use BehaviorSubject for connection status to provide initial state
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new Subject<any>();
  // NEW: Subject for session details
  private sessionDetailsSubject = new Subject<SessionDetails>();

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object // Inject PLATFORM_ID for environment check
  ) {
    console.log('>>> SocketService: Constructor starting...');

    // Only initialize Socket.IO if running in a browser environment
    if (isPlatformBrowser(this.platformId)) {
      console.log(
        '>>> SocketService: Running on Browser, initializing Socket.IO...'
      );
      try {
        // Initialize socket client pointing to your backend URL
        // autoConnect: false prevents automatic connection; call connect() manually
        this.socket = io('http://localhost:3001', {
          // Replace with your actual backend URL
          autoConnect: false,
          reconnectionAttempts: 5, // Example: Limit reconnection attempts
          reconnectionDelay: 3000, // Example: Wait 3 seconds before retrying
        });

        // Register core event listeners
        this.registerCoreListeners();

        // Connect immediately after setup (optional)
        this.connect();
      } catch (error) {
        console.error(
          '>>> SocketService: Error during socket.io-client initialization:',
          error
        );
      }
    } else {
      console.log(
        '>>> SocketService: Running on Server/Other platform, skipping Socket.IO initialization.'
      );
    }
  }

  // Helper method to register essential socket event listeners
  private registerCoreListeners(): void {
    if (!this.socket) return; // Guard against uninitialized socket

    // --- Connection Events ---
    this.socket.on('connect', () => {
      this.ngZone.run(() => {
        // Run inside Angular zone for UI updates
        console.log('>>> Socket.IO Connected! ID:', this.socket.id);
        this.connectionStatusSubject.next(true); // Notify connection success
      });
    });

    this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      this.ngZone.run(() => {
        console.log('>>> Socket.IO Disconnected:', reason);
        this.connectionStatusSubject.next(false); // Notify disconnection
        if (reason === 'io server disconnect') {
          console.warn('>>> SocketService: Server initiated disconnect.');
          // Handle server disconnect specifically if needed
        }
        // Optional: Attempt reconnection logic here if needed beyond default behavior
      });
    });

    // --- Error Events ---
    this.socket.on('connect_error', (err: Error) => {
      this.ngZone.run(() => {
        console.error('>>> Socket.IO Connection Error:', err.message, err);
        this.errorSubject.next(err); // Notify about connection errors
        this.connectionStatusSubject.next(false); // Ensure status reflects connection failure
      });
    });

    this.socket.on('error', (errorFromServer: any) => {
      this.ngZone.run(() => {
        console.error(
          ">>> SocketService: Received 'error' event from server:",
          errorFromServer
        );
        this.errorSubject.next(errorFromServer); // Notify about generic errors from server
      });
    });

    // --- Custom Application Events ---

    // Listener for new messages
    this.socket.on('newMessage', (data: any) => {
      this.ngZone.run(() => {
        console.log(">>> SocketService: Received 'newMessage'", data);
        // Basic validation and transformation
        if (data && data.sender && data.content) {
          const chatMessage: ChatMessage = {
            id: data.id?.toString(), // Ensure ID is string if present
            sender: data.sender,
            // Use received type, default to 'text' if missing
            type: data.type || 'text',
            // Content can be string or object, pass it through
            content: data.content,
            // Use timestamp from server if available, otherwise current time
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
            liked: data.liked ?? false, // Default to false if missing
            disliked: data.disliked ?? false, // Default to false if missing
          };
          this.newMessageSubject.next(chatMessage);
        } else {
          console.warn(
            ">>> SocketService: Received invalid 'newMessage' data structure:",
            data
          );
          this.errorSubject.next({
            message: 'Received invalid message format from server.',
            data: data,
          });
        }
      });
    });

    // NEW: Listener for session details
    this.socket.on('sessionDetails', (data: any) => {
      this.ngZone.run(() => {
        console.log(">>> SocketService: Received 'sessionDetails'", data);
        // Validate expected fields
        if (
          data &&
          typeof data.sessionId === 'number' &&
          typeof data.sessionToken === 'string'
        ) {
          const sessionDetails: SessionDetails = {
            sessionId: data.sessionId,
            sessionToken: data.sessionToken,
          };
          this.sessionDetailsSubject.next(sessionDetails); // Notify component
        } else {
          console.warn(
            ">>> SocketService: Received invalid 'sessionDetails' data structure:",
            data
          );
          this.errorSubject.next({
            message: 'Received invalid session details format from server.',
            data: data,
          });
        }
      });
    });
  }

  // --- Public Methods for Component Interaction ---

  /** Attempts to establish a connection to the Socket.IO server. */
  connect(): void {
    if (
      isPlatformBrowser(this.platformId) &&
      this.socket &&
      !this.socket.connected
    ) {
      console.log('>>> SocketService: Attempting to connect...');
      this.socket.connect();
    } else if (isPlatformBrowser(this.platformId) && this.socket?.connected) {
      console.log('>>> SocketService: Already connected.');
    } else if (!isPlatformBrowser(this.platformId)) {
      console.warn(
        '>>> SocketService: Cannot connect. Not running on a browser platform.'
      );
    } else {
      console.error(
        '>>> SocketService: Socket object not initialized. Cannot connect.'
      );
    }
  }

  /** Disconnects from the Socket.IO server. */
  disconnect(): void {
    if (isPlatformBrowser(this.platformId) && this.socket?.connected) {
      console.log('>>> SocketService: Disconnecting...');
      this.socket.disconnect();
    }
  }

  /**
   * Sends a message to the server via the 'sendMessage' event.
   * @param data - The message data including text, tenantId, and optional session info.
   */
  sendMessage(data: {
    text: string;
    tenantId: number;
    sessionId?: number;
    sessionToken?: string;
  }): void {
    if (isPlatformBrowser(this.platformId) && this.socket?.connected) {
      // Ensure tenantId is provided
      if (typeof data.tenantId !== 'number') {
        console.error(
          '>>> SocketService: Cannot send message. Tenant ID is missing or invalid.',
          data
        );
        this.errorSubject.next({
          message: 'Cannot send message: Tenant ID is required.',
        });
        return;
      }
      console.log('>>> SocketService: Emitting "sendMessage" with data:', data);
      // Emit the event with the correct payload structure expected by the backend
      this.socket.emit('sendMessage', {
        text: data.text,
        tenantId: data.tenantId,
        sessionId: data.sessionId, // Pass along if available
        sessionToken: data.sessionToken, // Pass along if available
      });
    } else {
      const errorMsg =
        'Cannot send message: Socket not connected or not running on browser.';
      console.error(`>>> SocketService: ${errorMsg}`);
      this.errorSubject.next({ message: errorMsg }); // Notify about the error
    }
  }

  /** Returns an Observable that emits whenever a new chat message is received. */
  listenForNewMessages(): Observable<ChatMessage> {
    return this.newMessageSubject.asObservable();
  }

  /** Returns an Observable that emits the current connection status (true for connected, false for disconnected). */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  /** Returns an Observable that emits whenever a socket or server error occurs. */
  listenForErrors(): Observable<any> {
    return this.errorSubject.asObservable();
  }

  /** NEW: Returns an Observable that emits session details when received from the server. */
  listenForSessionDetails(): Observable<SessionDetails> {
    return this.sessionDetailsSubject.asObservable();
  }

  // --- Add other methods as needed ---
  // Example: Method to send feedback
  // sendFeedback(feedbackData: { messageId: string; rating: 'Positive' | 'Negative' | null; comment?: string }): void {
  //   if (isPlatformBrowser(this.platformId) && this.socket?.connected) {
  //     console.log('>>> SocketService: Emitting "sendFeedback"', feedbackData);
  //     this.socket.emit('sendFeedback', feedbackData); // Ensure backend listens for 'sendFeedback'
  //   } else {
  //     console.error('>>> SocketService: Cannot send feedback. Socket not connected or not on browser.');
  //   }
  // }
}
