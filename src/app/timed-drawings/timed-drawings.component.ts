import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Howl } from 'howler';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { ApiService, ImageInfo, FolderInfo } from '../services/api.service';
import { SessionStateService } from '../services/session-state.service';
import { TagFilterComponent } from '../tag-filter/tag-filter.component';
import { FullscreenImageModalComponent } from '../fullscreen-image-modal/fullscreen-image-modal.component';

@Component({
  selector: 'app-timed-drawings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TagFilterComponent,
    FullscreenImageModalComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './timed-drawings.component.html',
  styleUrls: ['./timed-drawings.component.css']
})
export class TimedDrawingsComponent implements OnInit, OnDestroy {
  duration: number = 120;
  timeLeft: number = 0;
  currentImage: ImageInfo | null = null;
  isRunning: boolean = false;
  isLoading: boolean = false;
  errorLoading: string | null = null;
  imageVisible: boolean = false;
  sessionEverStarted: boolean = false;
  showFullscreenModal: boolean = false;

  private destroy$ = new Subject<void>();
  private timerSubscription?: Subscription;
  private imageLoadTimeoutSubscription?: Subscription;
  private chimeSound: Howl;

  activeTags: string[] = [];
  availableFolders: FolderInfo[] = [];
  selectedFolder: string = "";

  constructor(
    public apiService: ApiService,
    public sessionStateService: SessionStateService,
    private router: Router
  ) {
    // Initialize chimeSound
    this.chimeSound = new Howl({
      src: ['/chime.mp3'], // Local chime sound file in public/ directory
      html5: true
    });
  }

  ngOnInit(): void {
    this.loadAvailableFolders();
    this.timeLeft = this.duration;
  }

  public checkIsNaN(value: any): boolean {
    return isNaN(value);
  }

  loadAvailableFolders(): void {
     this.apiService.getFolders(this.activeTags.length > 0 ? this.activeTags : undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe(folders => {
        this.availableFolders = folders.sort((a,b) => a.name.localeCompare(b.name));
        if (this.selectedFolder && !this.availableFolders.find(f => f.name === this.selectedFolder)) {
            this.selectedFolder = ""; // Reset if selected folder is no longer valid with current tags
        }
      });
  }

  onTagsUpdated(tags: string[]): void {
    this.activeTags = tags;
    this.loadAvailableFolders(); // Refresh folders based on new tags
    this.handleFilterChange();
  }
  
  handleFilterChange(): void {
    if (this.isRunning) {
      this.loadNewImage(); 
    } else if (this.currentImage || this.sessionEverStarted) {
        this.isLoading = true;
        this.errorLoading = null;
        this.currentImage = null; 
        this.imageVisible = false;
        this.apiService.getRandomImage(this.selectedFolder || undefined, this.activeTags.length > 0 ? this.activeTags : undefined)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (image) => {
                    this.currentImage = image;
                    this.isLoading = false;
                    if (image) { 
                        this.imageVisible = true;
                        this.errorLoading = null;
                    } else {
                        this.errorLoading = "No image matches new criteria.";
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    this.imageVisible = false;
                    this.errorLoading = 'Failed to load preview image for new filters. ' + (err.error?.message || err.message);
                    console.error(err);
                }
            });
    }
  }

  startSession(): void {
    // Using global isNaN() here is fine as it's within the .ts file's scope
    if (this.duration <= 0 || isNaN(this.duration)) {
        this.errorLoading = "Please enter a valid duration greater than 0.";
        return;
    }
    if (!this.sessionEverStarted) {
        this.sessionStateService.clearViewedImages();
    }
    this.sessionEverStarted = true;
    this.isRunning = true;
    this.errorLoading = null; 
    this.loadNewImage();
    this.showFullscreenModal = true; // Show modal on session start
  }

  stopSession(): void {
    this.isRunning = false;
    this.timerSubscription?.unsubscribe();
    this.imageLoadTimeoutSubscription?.unsubscribe();
  }

  resumeSession(): void {
    if (!this.isRunning && this.sessionEverStarted && this.currentImage) {
      this.isRunning = true;
      this.startTimer();
    }
  }
  
  resetSessionAndFilters(): void {
    this.stopSession();
    this.showFullscreenModal = false;
    this.sessionEverStarted = false;
    this.currentImage = null;
    this.errorLoading = null;
    this.activeTags = []; 
    this.selectedFolder = "";
    this.sessionStateService.clearViewedImages();
    this.loadAvailableFolders(); 
    this.timeLeft = this.duration;
  }

  nextImageManually(): void {
    if (!this.isRunning) return;
    this.loadNewImage();
  }
  
  imageLoaded(): void {
    this.imageLoadTimeoutSubscription?.unsubscribe();
    if (this.currentImage) { 
        this.isLoading = false; 
        this.imageVisible = true;
        this.errorLoading = null; 
    }
  }

  imageLoadError(): void {
    this.imageLoadTimeoutSubscription?.unsubscribe();
    this.isLoading = false;
    this.imageVisible = false;
    const failedImageName = this.currentImage?.fileName || "Unknown image";
    this.errorLoading = `Error loading: ${failedImageName}. Skipping.`;
    this.currentImage = null; 
    if (this.isRunning) {
        timer(1000).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadNewImage()); 
    }
  }

  loadNewImage(): void {
    if (!this.isRunning && !this.sessionEverStarted) return; 

    this.isLoading = true; 
    this.errorLoading = null;
    this.imageVisible = false; 
    this.timerSubscription?.unsubscribe();
    this.imageLoadTimeoutSubscription?.unsubscribe();

    this.imageLoadTimeoutSubscription = timer(10000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.isLoading) { 
        this.imageLoadError(); 
      }
    });

    this.apiService.getRandomImage(this.selectedFolder || undefined, this.activeTags.length > 0 ? this.activeTags : undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (image) => {
          if (!image) { 
            this.isLoading = false;
            this.currentImage = null;
            this.errorLoading = "No images match the current filter criteria.";
            if (this.isRunning) this.stopSession(); 
            return;
          }
          this.currentImage = image; 
          if (image && this.sessionEverStarted) { 
            this.sessionStateService.addImageViewed(image);
          }
          
          if (this.isRunning) {
            this.timeLeft = this.duration;
            this.startTimer();
            this.showFullscreenModal = true;
          } else { 
            if (!this.currentImage) { 
                this.isLoading = false;
            }
             // For non-running state, imageLoaded() will handle isLoading=false and imageVisible=true
          }
        },
        error: (err) => {
          console.error('Error loading image:', err);
          this.errorLoading = 'Failed to load image. ' + (err.error?.message || err.message || 'Server error.');
          this.currentImage = null;
          this.isLoading = false;
          this.imageVisible = false;
          this.imageLoadTimeoutSubscription?.unsubscribe();
          if (this.isRunning) {
             timer(2000).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadNewImage());
          }
        }
      });
  }

  private startTimer(): void {
    if (!this.isRunning) return;
    this.timerSubscription = timer(0, 1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        // Play chime at 10, 3, 2, 1 seconds remaining
        if ([10, 3, 2, 1].includes(this.timeLeft)) {
          this.playChime();
        }
      } else {
        if (this.isRunning) { 
            this.loadNewImage();
        }
      }
    });
  }

  private playChime(): void {
    if (this.chimeSound) {
      this.chimeSound.play();
    }
  }

  closeFullscreenModal(): void {
    this.stopSession(); // Stop session when modal is closed
    this.showFullscreenModal = false;
  }

  viewSessionSummary(): void {
    this.stopSession(); // Stop session before navigating
    this.router.navigate(['/summary']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
