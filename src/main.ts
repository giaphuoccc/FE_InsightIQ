// File: src/main.ts
// Mục đích: Khởi chạy AppComponent (ứng dụng Angular chính)
// và đồng thời định nghĩa custom element <widget-user>.
// Dùng cho `ng serve` và khi build ứng dụng chính.

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component'; // Component gốc của ứng dụng FE_InsightIQ
import { appConfig } from './app/app.config'; // Cấu hình ứng dụng chính của bạn

// Các import cần thiết cho custom element
import { Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { WidgetUserComponent } from './app/components/widget-user/widget-user.component'; // Đường dẫn đến widget component

bootstrapApplication(AppComponent, appConfig)
  .then(appRef => {
    // appRef là ApplicationRef của ứng dụng AppComponent vừa khởi chạy
    console.log('Ứng dụng Angular (AppComponent) đã bootstrap thành công!');

    // Lấy injector từ ApplicationRef này
    const injector = appRef.injector;

    // Tạo và đăng ký custom element 'widget-user'
    // Điều này cho phép bạn cũng có thể test widget-user ngay trong ứng dụng chính nếu cần,
    // bằng cách thêm thẻ <widget-user> vào template của AppComponent hoặc một component con.
    const widgetElement = createCustomElement(WidgetUserComponent, { injector });
    if (!customElements.get('widget-user')) {
      customElements.define('widget-user', widgetElement);
      console.log('Custom element "widget-user" đã được đăng ký (sử dụng injector từ AppComponent).');
    }
  })
  .catch(err => console.error('Lỗi khi bootstrap AppComponent hoặc đăng ký custom element:', err));
