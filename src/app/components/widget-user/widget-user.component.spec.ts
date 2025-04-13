import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetUserComponent } from './widget-user.component';

describe('ChatbotComponent', () => {
  let component: WidgetUserComponent;
  let fixture: ComponentFixture<WidgetUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WidgetUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
