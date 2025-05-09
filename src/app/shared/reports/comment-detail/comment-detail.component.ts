import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../core/reportManagement.service';

@Component({
  selector: 'app-comment-detail',
  standalone: true,                    // Enable standalone component
  imports: [CommonModule],            // Import CommonModule for directives
  templateUrl: './comment-detail.component.html',
  styleUrls: ['./comment-detail.component.css'], // Correct plural key
})
export class CommentDetailComponent implements OnInit {
  // --- Component Properties ---
  //chatMessage: ChatMessage[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  commentId: string | null = null;
  originalCommentText: string | null = null;

  constructor(
    private route: ActivatedRoute,     // Provides access to route parameters
    private reportService: ReportService,
    private location: Location
  ) {
    // Constructor injection sets up route, reportService, and location
  }

  ngOnInit(): void {
    // 1. Get the ID from the route
    this.commentId = this.route.snapshot.paramMap.get('id');

    // 2. Check if ID exists and call the dedicated loading method
    if (this.commentId) {
      this.loadChatDetails(this.commentId);
    } else {
      console.error('ngOnInit: Comment ID is missing from route parameters!');
      this.errorMessage =
        'Cannot load details: Comment ID not provided in the URL.';
    }
  }

  // --- Dedicated Private Method for Loading Data ---
  private loadChatDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    console.log(`loadChatDetails: Fetching chat details for comment ID: ${id}`);

  //   this.reportService.getChatDetail(id).subscribe({
  //     next: (data: ChatMessage[]) => {
  //       console.log('loadChatDetails: Successfully received chat data:', data);
  //       this.chatMessage = data;
  //       this.isLoading = false;
  //     },
  //     error: (err) => {
  //       console.error('loadChatDetails: Error fetching chat details:', err);
  //       this.errorMessage =
  //         'Failed to load chat details. Please try again later.';
  //       this.isLoading = false;
  //     }
  //   });
  // }
  // --- End Dedicated Loading Method ---

  // goBack(): void {
  //   this.location.back();  // Navigate back in browser history
  // }
}}
