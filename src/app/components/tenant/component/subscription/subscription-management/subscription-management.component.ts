import { Component } from '@angular/core';
import { CurrentSubscriptionComponent } from '../current-subscription/current-subscription.component'; // Import
import { RouterLink, RouterOutlet } from '@angular/router'; // Import router directives

@Component({
  selector: 'app-subscription-management',
  standalone: true,
  // Import necessary components/directives
  imports: [CurrentSubscriptionComponent, RouterLink, RouterOutlet],
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.css'],
})
export class SubscriptionManagementComponent {
  // Logic for this component (if any)
}
