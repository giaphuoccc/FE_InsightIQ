// report-management.component.ts

import { Component, OnInit } from '@angular/core'; // Import OnInit
import { CommonModule } from '@angular/common'; // Needed for *ngIf, *ngFor etc.
import { FormsModule } from '@angular/forms'; // Needed for ngModel
import { Router } from '@angular/router';

// Import your service and interfaces (adjust path if necessary)
import {
  ReportService,
  Comment,
  // ChatMessage,
  ReportStats,
} from '../../../core/report.service';

@Component({
  selector: 'app-report-management',
  standalone: true, // Assuming standalone based on original file
  imports: [CommonModule, FormsModule], // Add CommonModule and FormsModule
  templateUrl: './report-management.component.html',
  styleUrls: ['./report-management.component.css'], // Corrected from styleUrl
})
export class ReportManagementComponent implements OnInit {
  // Implement OnInit

  // --- Component Properties ---
  stats: ReportStats | null = null; // To hold statistics data
  comments: Comment[] = []; // To hold the list of comments
  isLoadingStats = false;
  isLoadingComments = false;
  errorMessage: string | null = null;

  // Properties for date filters (bound with ngModel)
  startDate: string = ''; // e.g., '2024-04-01'
  endDate: string = ''; // e.g., '2024-04-11'

  // Inject the ReportService
  constructor(private reportService: ReportService, private router: Router) {}

  // --- Lifecycle Hook ---
  ngOnInit(): void {
    // Fetch initial data when the component loads
    this.loadStatistics();
    this.loadComments();
  }

  // --- Data Loading Methods ---
  loadStatistics(startDate?: string, endDate?: string): void {
    this.isLoadingStats = true;
    this.errorMessage = null; // Clear previous errors

    this.reportService.getStatistics(startDate, endDate).subscribe({
      next: (data) => {
        this.stats = data; // Assign received mock data
        this.isLoadingStats = false;
        console.log('Received stats:', this.stats);
      },
      error: (err) => {
        // Even with mocks, good to have error handling structure
        console.error('Error fetching statistics:', err);
        this.errorMessage = 'Failed to load statistics.';
        this.isLoadingStats = false;
      },
      // complete: () => { console.log('Statistics loading complete.'); } // Optional
    });
  }

  loadComments(startDate?: string, endDate?: string): void {
    this.isLoadingComments = true;
    // Optionally clear specific comment errors or use the general errorMessage
    // this.errorMessage = null;

    this.reportService.getComments(startDate, endDate).subscribe({
      next: (data) => {
        this.comments = data; // Assign received mock data
        this.isLoadingComments = false;
        console.log('Received comments:', this.comments);
      },
      error: (err) => {
        console.error('Error fetching comments:', err);
        this.errorMessage =
          (this.errorMessage ? this.errorMessage + ' ' : '') +
          'Failed to load comments.';
        this.isLoadingComments = false;
      },
      // complete: () => { console.log('Comments loading complete.'); } // Optional
    });
  }

  // --- Event Handler Methods ---
  onFilterData(): void {
    console.log(
      'Filter button clicked. Start:',
      this.startDate,
      'End:',
      this.endDate
    );
    // Call load methods with current dates
    // Note: The mock service currently ignores these dates, but this structure is ready for the real service
    this.loadStatistics(this.startDate, this.endDate);
    this.loadComments(this.startDate, this.endDate);
  }

  onSeeCommentDetail(commentId: string): void {
    console.log('Navigating to detail for comment ID:', commentId);
    if (!commentId) {
      console.error('Cannot navigate without a comment ID!');
      return; // Don't navigate if the ID is missing
    }
    // 4. Use router.navigate
    // First element is the path from your routes config
    // Second element is the value for the ':id' parameter
    this.router.navigate(['/report-conversation', commentId]);
  }

  onDownload(): void {
    console.log('Download button clicked.');
    // TODO: Implement download logic - Requires a service method and backend endpoint
    alert('Download functionality not yet implemented.');
  }
}
