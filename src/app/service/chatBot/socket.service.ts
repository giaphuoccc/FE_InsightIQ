// src/app/core/chatBotService/socket.service.ts

import { Injectable, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

// Define ChatMessage interface for what this service will emit
// This should align with what WidgetUserComponent expects for incoming bot messages
export interface ServiceChatMessage {
  id?: string; // Optional: if backend sends a client-meaningful string ID, otherwise WidgetUser will generate its own
  dbMessageId?: number; // THIS IS THE ACTUAL DATABASE ID OF THE BOT MESSAGE
  sender: 'user' | 'bot';
  type: 'text' | 'productInfo' | 'productComparison' | 'productPromotion';
  content: any;
  timestamp: Date | string; // Allow string initially, convert to Date in component
  liked?: boolean;
  disliked?: boolean;
}

export interface SessionDetails {
  sessionId: number;
  sessionToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private newMessageSubject = new Subject<ServiceChatMessage>(); // Emits ServiceChatMessage
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new Subject<any>();
  private sessionDetailsSubject = new Subject<SessionDetails>();

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('>>> SocketService: Constructor starting...');
    if (isPlatformBrowser(this.platformId)) {
      console.log(
        '>>> SocketService: Running on Browser, initializing Socket.IO...'
      );
      try {
        this.socket = io('http://localhost:3001', {
          // Your backend URL
          autoConnect: false,
          reconnectionAttempts: 5,
          reconnectionDelay: 3000,
        });
        this.registerCoreListeners();
        // this.connect(); // Connect manually when chat starts or as needed
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

  private registerCoreListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.ngZone.run(() => {
        console.log('>>> Socket.IO Connected! ID:', this.socket.id);
        this.connectionStatusSubject.next(true);
      });
    });

    this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      this.ngZone.run(() => {
        console.log('>>> Socket.IO Disconnected:', reason);
        this.connectionStatusSubject.next(false);
        if (reason === 'io server disconnect') {
          console.warn('>>> SocketService: Server initiated disconnect.');
        }
      });
    });

    this.socket.on('connect_error', (err: Error) => {
      this.ngZone.run(() => {
        console.error('>>> Socket.IO Connection Error:', err.message, err);
        this.errorSubject.next(err);
        this.connectionStatusSubject.next(false);
      });
    });

    this.socket.on('error', (errorFromServer: any) => {
      this.ngZone.run(() => {
        console.error(
          ">>> SocketService: Received 'error' event from server:",
          errorFromServer
        );
        this.errorSubject.next(errorFromServer);
      });
    });

    this.socket.on('newMessage', (data: any) => {
      this.ngZone.run(() => {
        console.log(">>> SocketService: Received 'newMessage'", data);
        if (data && data.sender && data.content) {
          let parsedDbId: number | undefined = undefined;
          if (data.id !== null && data.id !== undefined) {
            // data.id from backend is the dbMessageId
            const numId = Number(data.id);
            if (!isNaN(numId)) {
              parsedDbId = numId;
            } else {
              console.warn(
                `>>> SocketService: Received non-numeric id from server: ${data.id}`
              );
            }
          }

          const chatMessage: ServiceChatMessage = {
            dbMessageId: parsedDbId, // This is the numeric ID from the database
            sender: data.sender,
            type: data.type || 'text',
            content: data.content,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(), // Ensure it's a Date object
            liked: data.liked ?? false,
            disliked: data.disliked ?? false,
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

    this.socket.on('sessionDetails', (data: any) => {
      this.ngZone.run(() => {
        console.log(">>> SocketService: Received 'sessionDetails'", data);
        if (
          data &&
          typeof data.sessionId === 'number' &&
          typeof data.sessionToken === 'string'
        ) {
          this.sessionDetailsSubject.next({
            sessionId: data.sessionId,
            sessionToken: data.sessionToken,
          });
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

  disconnect(): void {
    if (isPlatformBrowser(this.platformId) && this.socket?.connected) {
      console.log('>>> SocketService: Disconnecting...');
      this.socket.disconnect();
    }
  }

  sendMessage(data: {
    text: string;
    tenantId: number;
    sessionId?: number;
    sessionToken?: string;
  }): void {
    if (isPlatformBrowser(this.platformId) && this.socket?.connected) {
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
      this.socket.emit('sendMessage', {
        text: data.text,
        tenantId: data.tenantId,
        sessionId: data.sessionId,
        sessionToken: data.sessionToken,
      });
    } else {
      const errorMsg =
        'Cannot send message: Socket not connected or not running on browser.';
      console.error(`>>> SocketService: ${errorMsg}`);
      this.errorSubject.next({ message: errorMsg });
    }
  }

  listenForNewMessages(): Observable<ServiceChatMessage> {
    return this.newMessageSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  listenForErrors(): Observable<any> {
    return this.errorSubject.asObservable();
  }

  listenForSessionDetails(): Observable<SessionDetails> {
    return this.sessionDetailsSubject.asObservable();
  }
}
