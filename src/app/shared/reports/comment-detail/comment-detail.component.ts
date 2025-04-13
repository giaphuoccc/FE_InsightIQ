import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ReportService, ChatMessage } from '../../../core/report.service';

@Component({
  selector: 'app-comment-detail',
  imports: [CommonModule],
  templateUrl: './comment-detail.component.html',
  styleUrl: './comment-detail.component.css',
})
export class CommentDetailComponent implements OnInit {
  // --- Component Properties ---
  chatMessage: ChatMessage[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  commentId: string | null = null;
  originalCommentText: string | null = null;

  ngOnInit(): void {
    // 1. Get the ID from the route
    this.commentId = this.route.snapshot.paramMap.get('id');

    // 2. Check if ID exists and call the dedicated loading method
    if (this.commentId) {
      this.loadChatDetails(this.commentId); // Call the separate method
    } else {
      console.error('ngOnInit: Comment ID is missing from route parameters!');
      this.errorMessage =
        'Cannot load details: Comment ID not provided in the URL.';
    }
  }
  constructor(
    private route: ActivatedRoute, // Injects ActivatedRoute for getting commentId from URL
    private reportService: ReportService, // Injects your custom service for fetching data
    private location: Location // Injects Location service for browser history navigation
  ) {
    // NO CODE needed inside the constructor body for the injection itself.
    // The 'private' keyword handles creating 'this.route', 'this.reportService',
    // and 'this.location' and assigning the injected instances.
  }

  // --- NEW: Dedicated Private Method for Loading Data ---
  private loadChatDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    console.log(`loadChatDetails: Fetching chat details for comment ID: ${id}`);

    this.reportService.getChatDetail(id).subscribe({
      next: (data: ChatMessage[]) => {
        console.log('loadChatDetails: Successfully received chat data:', data);
        this.chatMessage = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('loadChatDetails: Error fetching chat details:', err);
        this.errorMessage =
          'Failed to load chat details. Please try again later.';
        this.isLoading = false;
      },
    });
  }
  // --- End Dedicated Loading Method ---

  goBack(): void {
    this.location.back();
  }
}
