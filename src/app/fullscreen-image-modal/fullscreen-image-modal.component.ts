import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageInfo, FolderInfo, ApiService } from '../services/api.service';
import { SessionStateService } from '../services/session-state.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fullscreen-image-modal',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './fullscreen-image-modal.component.html',
  styleUrls: ['./fullscreen-image-modal.component.css']
})
export class FullscreenImageModalComponent {
  @Input() imageUrl: string | null = null;
  @Input() imageVisible: boolean = false;
  @Input() timeLeft: number = 0;
  @Input() isRunning: boolean = false;
  @Input() currentImage: ImageInfo | null = null;
  @Input() isLoading: boolean = false;
  @Input() errorLoading: string | null = null;
  @Input() sessionEverStarted: boolean = false;
  @Input() activeTags: string[] = [];
  @Input() selectedFolder: string = "";
  @Input() sessionStateService!: SessionStateService;

  @Output() closeModal = new EventEmitter<void>();
  @Output() imageLoaded = new EventEmitter<void>();
  @Output() imageLoadError = new EventEmitter<void>();
  @Output() nextImageManually = new EventEmitter<void>();
  @Output() stopSession = new EventEmitter<void>();
  @Output() resumeSession = new EventEmitter<void>();
  @Output() resetSessionAndFilters = new EventEmitter<void>();
  @Output() viewSessionSummary = new EventEmitter<void>();


  constructor(public apiService: ApiService) {} // Inject ApiService to use imageServerBaseUrl

  onClose(): void {
    this.closeModal.emit();
  }

  onImageLoad(): void {
    this.imageLoaded.emit();
  }

  onImageError(): void {
    this.imageLoadError.emit();
  }

  onNextImageManually(): void {
    this.nextImageManually.emit();
  }

  onStopSession(): void {
    this.stopSession.emit();
  }

  onResumeSession(): void {
    this.resumeSession.emit();
  }

  onResetSessionAndFilters(): void {
    this.resetSessionAndFilters.emit();
  }

  onViewSessionSummary(): void {
    this.viewSessionSummary.emit();
  }
}
