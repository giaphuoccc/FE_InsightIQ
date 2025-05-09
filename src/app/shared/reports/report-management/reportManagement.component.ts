import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ReportService,
  RatingSummary,
  FeedbackItem
} from '../../../core/reportManagement.service';

@Component({
  selector: 'app-report-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportManagement.component.html',
  styleUrls: ['./reportManagement.component.css'],
})
export class ReportManagementComponent implements OnInit {
  stats: RatingSummary | null = null;
  comments: FeedbackItem[] = [];
  isLoadingStats = false;
  isLoadingComments = false;
  errorMessage: string | null = null;

  startDate = '';
  endDate = '';

  private isBrowser: boolean;

  constructor(
    private reportService: ReportService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const role = localStorage.getItem('user_role');
    if (role === 'SUPERADMIN') {
      this.loadSuperadminData();
    } else if (role === 'TENANT') {
      this.loadTenantData();
    } else {
      this.errorMessage = 'Unknown role; cannot load data.';
    }
  }

  private loadSuperadminData(): void {
    this.isLoadingStats = true;
    this.errorMessage = null;

    this.reportService.getRatingSummary().subscribe({
      next: summary => {
        console.log('SUPERADMIN rating summary:', summary);
        this.stats = summary;
        this.isLoadingStats = false;
      },
      error: err => {
        console.error('Error loading SUPERADMIN stats:', err);
        this.errorMessage = 'Failed to load statistics.';
        this.isLoadingStats = false;
      }
    });

    this.isLoadingComments = true;
    this.reportService.getAllFeedbacks().subscribe({
      next: items => {
        console.log('SUPERADMIN all feedbacks:', items);
        this.comments = items;
        this.isLoadingComments = false;
      },
      error: err => {
        console.error('Error loading SUPERADMIN comments:', err);
        this.errorMessage = (this.errorMessage || '') + ' Failed to load comments.';
        this.isLoadingComments = false;
      }
    });
  }

  private loadTenantData(): void {
    this.isLoadingStats = true;
    this.isLoadingComments = true;
    this.errorMessage = null;

    this.reportService.getTenantInfo().subscribe({
      next: info => {
        console.log('TENANT info:', info);
        const tid = info.tenantId;

        this.reportService.getTenantRatingSummary(tid).subscribe({
          next: summary => {
            console.log(`TENANT(${tid}) rating summary:`, summary);
            this.stats = summary;
            this.isLoadingStats = false;
          },
          error: err => {
            console.error(`Error loading TENANT(${tid}) stats:`, err);
            this.errorMessage = 'Failed to load statistics.';
            this.isLoadingStats = false;
          }
        });

        this.reportService.getTenantFeedbacks(tid).subscribe({
          next: items => {
            console.log(`TENANT(${tid}) feedbacks:`, items);
            this.comments = items;
            this.isLoadingComments = false;
          },
          error: err => {
            console.error(`Error loading TENANT(${tid}) comments:`, err);
            this.errorMessage = (this.errorMessage || '') + ' Failed to load comments.';
            this.isLoadingComments = false;
          }
        });
      },
      error: err => {
        console.error('Error fetching TENANT info:', err);
        this.errorMessage = 'Cannot fetch tenant info.';
        this.isLoadingStats = false;
        this.isLoadingComments = false;
      }
    });
  }

  // onFilterData(): void {
  //   // console.log('Filter button clicked with dates', this.startDate, this.endDate);
  //   // this.ngOnInit();
  // }

  onSeeCommentDetail(messageId: number): void {
    console.log('Navigating to comment detail, messageId =', messageId);
    this.router.navigate(['/report-conversation', messageId]);
  }

  onDownload(): void {
    console.log('Download button clicked.');
    alert('Download not implemented.');
  }
}
