import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductPromotionComponent } from './product-promotion.component';

describe('ProductPromotionComponent', () => {
  let component: ProductPromotionComponent;
  let fixture: ComponentFixture<ProductPromotionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductPromotionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductPromotionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
