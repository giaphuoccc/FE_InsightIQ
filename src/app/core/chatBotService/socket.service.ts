// src/app/core/chatBotService/socket.service.ts  <-- (Giả sử đây là đường dẫn đúng)

// Import các thành phần cần thiết
import { Injectable, NgZone, Inject, PLATFORM_ID } from '@angular/core'; // Thêm Inject, PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // Thêm isPlatformBrowser
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from '../../components/widget-user/widget-user.component'; // <-- Đảm bảo đường dẫn này chính xác
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  // Khai báo socket nhưng chưa khởi tạo ngay
  // Dùng '!' để báo TypeScript rằng chúng ta sẽ đảm bảo nó được khởi tạo trước khi dùng (trong khối 'if isPlatformBrowser')
  private socket!: Socket;

  // Sử dụng Subject để quản lý các Observable cho các sự kiện từ server
  private newMessageSubject = new Subject<ChatMessage>();
  private connectionStatusSubject = new Subject<boolean>(); // True khi kết nối, false khi mất
  private errorSubject = new Subject<any>(); // Để thông báo lỗi chung

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object // Inject PLATFORM_ID để kiểm tra môi trường
  ) {
    console.log('>>> SocketService: Constructor starting...');

    // Chỉ thực hiện các thao tác liên quan đến Socket.IO nếu đang chạy trên trình duyệt
    if (isPlatformBrowser(this.platformId)) {
      console.log('>>> SocketService: Running on Browser, initializing Socket.IO...');
      try {
        // Khởi tạo socket client, trỏ đến địa chỉ backend của bạn
        // autoConnect: false nghĩa là nó sẽ không tự động kết nối ngay,
        // chúng ta sẽ gọi connect() thủ công khi cần hoặc ngay sau đó.
        this.socket = io('http://localhost:3001', {
          autoConnect: false
        });

        // Đăng ký các hàm lắng nghe sự kiện cơ bản
        this.registerCoreListeners();

        // Nếu bạn muốn nó tự kết nối ngay khi service được tạo, gọi connect() ở đây:
        this.connect();

      } catch (error) {
         console.error(">>> SocketService: Error during socket.io-client initialization:", error);
      }

    } else {
      console.log('>>> SocketService: Running on Server/Other platform, skipping Socket.IO initialization.');
    }
  }

  // Hàm helper để đăng ký các listener sự kiện cốt lõi
  private registerCoreListeners(): void {
     if (!this.socket) return; // Chỉ đăng ký nếu socket đã được khởi tạo

     this.socket.on('connect', () => {
       this.ngZone.run(() => { // Luôn chạy trong Angular zone để đảm bảo UI cập nhật
         console.log('>>> Socket.IO Connected! ID:', this.socket.id);
         this.connectionStatusSubject.next(true); // Thông báo đã kết nối
       });
     });

     this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
       this.ngZone.run(() => {
         console.log('>>> Socket.IO Disconnected:', reason);
         this.connectionStatusSubject.next(false); // Thông báo đã mất kết nối
         if (reason === 'io server disconnect') {
           // Có thể xử lý thêm nếu server chủ động ngắt
         }
       });
     });

     this.socket.on('connect_error', (err: Error) => {
       this.ngZone.run(() => {
         console.error('>>> Socket.IO Connection Error:', err.message, err);
         this.errorSubject.next(err); // Thông báo lỗi kết nối
         this.connectionStatusSubject.next(false);
       });
     });

     // Listener cho tin nhắn mới - Sử dụng Subject đã khai báo
     this.socket.on('newMessage', (data: any) => { // Dùng any để linh hoạt, xử lý type trong component nếu cần
       this.ngZone.run(() => {
         console.log(">>> SocketService: Received 'newMessage'", data);
         // Chuyển đổi data nhận được thành kiểu ChatMessage nếu cần
         const chatMessage: ChatMessage = {
             id: data.id?.toString(), // Chuyển id thành string nếu có
             sender: data.sender,
             type: data.type || 'text',
             content: data.content,
             timestamp: data.createdAt ? new Date(data.createdAt) : new Date(), // Ưu tiên createdAt từ server
             liked: data.liked,
             disliked: data.disliked
         };
         this.newMessageSubject.next(chatMessage);
       });
     });

     // Thêm các listener khác nếu cần (vd: 'sessionDetails', 'error' từ backend)
     this.socket.on('error', (errorFromServer: any) => {
        this.ngZone.run(() => {
            console.error(">>> SocketService: Received 'error' event from server:", errorFromServer);
            this.errorSubject.next(errorFromServer);
        });
     });

  }

  // --- Các phương thức Public để Component sử dụng ---

  connect(): void {
    // Chỉ kết nối nếu đang ở trình duyệt, socket đã tạo và chưa kết nối
    if (isPlatformBrowser(this.platformId) && this.socket && !this.socket.connected) {
      console.log('>>> SocketService: Attempting to connect...');
      this.socket.connect();
    } else if (isPlatformBrowser(this.platformId) && this.socket?.connected) {
       console.log('>>> SocketService: Already connected.');
    } else if (!isPlatformBrowser(this.platformId)) {
       console.warn(">>> SocketService: Cannot connect. Not running on a browser platform.");
    } else {
       console.error(">>> SocketService: Socket object not initialized. Cannot connect.");
    }
  }

  disconnect(): void {
    if (isPlatformBrowser(this.platformId) && this.socket?.connected) {
      console.log('>>> SocketService: Disconnecting...');
      this.socket.disconnect();
    }
  }

  // Sửa lại hàm sendMessage để nhận đủ thông tin cần thiết từ component
  // Ví dụ: cần tenantId, và sessionId/sessionToken
  sendMessage(data: { text: string; tenantId?: number; sessionId?: number; sessionToken?: string }): void {
    if (isPlatformBrowser(this.platformId) && this.socket?.connected) {
      console.log('>>> SocketService: Attempting to emit "sendMessage" with data:', data);
      console.log('>>> SocketService: Socket connected status:', this.socket?.connected); // Kiểm tra trạng thái kết nối
      console.log(">>> SocketService: Emitting 'sendMessage'", data);
      // Gửi đúng sự kiện 'sendMessage' với đủ dữ liệu mà backend cần
      this.socket.emit('sendMessage', {
          text: data.text,
          tenantId: data.tenantId, // Lấy từ đâu đó (ví dụ: service khác, state quản lý)
          sessionId: data.sessionId, // Lấy từ state quản lý session
          sessionToken: data.sessionToken // Lấy từ state quản lý session
      });
    } else {
      console.error('>>> SocketService: Cannot send message. Socket not connected or not on browser.');
      this.errorSubject.next({ message: 'Cannot send message: Socket not connected.' }); // Thông báo lỗi
    }
  }

  // Trả về Observable để component lắng nghe tin nhắn mới
  listenForNewMessages(): Observable<ChatMessage> {
    return this.newMessageSubject.asObservable();
  }

  // Trả về Observable để component biết trạng thái kết nối
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  // Trả về Observable để component biết lỗi
  listenForErrors(): Observable<any> {
     return this.errorSubject.asObservable();
  }

  // Thêm các phương thức khác nếu cần
}