import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { SessionStateService } from '../services/session-state.service';
import { ApiService, ImageInfo } from '../services/api.service';

@Component({
  selector: 'app-session-summary',
  standalone: true,
  imports: [ 
    CommonModule, 
    RouterLink,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './session-summary.component.html',
  styleUrls: ['./session-summary.component.css']
})
export class SessionSummaryComponent implements OnInit {
  viewedImages: ImageInfo[] = [];

  constructor(
    private sessionStateService: SessionStateService,
    public apiService: ApiService // Make public for template access to imageServerBaseUrl
  ) { }

  ngOnInit(): void {
    this.viewedImages = this.sessionStateService.getViewedImages();
  }

  clearSummary(): void {
    this.sessionStateService.clearViewedImages();
    this.viewedImages = [];
  }
}
