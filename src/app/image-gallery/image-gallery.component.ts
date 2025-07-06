import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService, ImageInfo, FolderInfo } from '../services/api.service';
import { TagFilterComponent } from '../tag-filter/tag-filter.component';

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TagFilterComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.css']
})
export class ImageGalleryComponent implements OnInit, OnDestroy, AfterViewInit {
  images: ImageInfo[] = [];
  currentPage: number = 1;
  pageSize: number = 24; 
  isLoading: boolean = false;
  allLoaded: boolean = false; 
  initialLoadDone: boolean = false;
  initialLoadFailed: boolean = false;

  private destroy$ = new Subject<void>();
  private intersectionObserver: IntersectionObserver | undefined;

  @ViewChild('scrollTrigger') scrollTrigger!: ElementRef;

  activeTags: string[] = [];
  availableFolders: FolderInfo[] = [];
  selectedFolder: string = "";

  constructor(
    public apiService: ApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.loadAvailableFolders();
    this.loadImages();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupIntersectionObserver();
    }
  }
  
  loadAvailableFolders(): void {
     this.apiService.getFolders(this.activeTags.length > 0 ? this.activeTags : undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe(folders => {
        this.availableFolders = folders.sort((a,b) => a.name.localeCompare(b.name));
        if (this.selectedFolder && !this.availableFolders.find(f => f.name === this.selectedFolder)) {
            this.selectedFolder = "";
        }
      });
  }

  onTagsUpdated(tags: string[]): void {
    console.log('onTagsUpdated: Resetting and loading images for tags:', tags);
    this.activeTags = tags;
    this.loadAvailableFolders();
    this.resetAndLoadImages();
  }
  
  resetAndLoadImages(): void {
    this.images = [];
    this.currentPage = 1;
    this.allLoaded = false;
    this.initialLoadDone = false;
    this.initialLoadFailed = false;
    this.isLoading = false;
    // Re-observe the trigger after resetting images
    if (isPlatformBrowser(this.platformId) && this.intersectionObserver) {
      this.intersectionObserver.unobserve(this.scrollTrigger.nativeElement);
      this.intersectionObserver.observe(this.scrollTrigger.nativeElement);
    }
    this.loadImages();
  }

  loadImages(): void {
    if (this.isLoading || this.allLoaded) {
      return;
    }
    this.isLoading = true;
    if (this.currentPage === 1) {
        this.initialLoadFailed = false; // Reset failed flag on new first load attempt
    }

    this.apiService.getGalleryImages(
        this.currentPage, 
        this.pageSize, 
        this.selectedFolder || undefined,
        this.activeTags.length > 0 ? this.activeTags : undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          if (result.items.length > 0) {
            // Filter out duplicates just in case (e.g., rapid scrolling/re-filtering)
            const processedNewImages: ImageInfo[] = result.items.filter(newItem =>
                !this.images.some(existingItem =>
                    existingItem.url === newItem.url && existingItem.folderName === newItem.folderName
                )
            );

            this.images = [...this.images, ...processedNewImages];
            this.currentPage++;
          }
          // Check if all images are loaded
          // Only set allLoaded to true if the current API call returns no items.
          if (result.items.length === 0) {
            this.allLoaded = true;
            // If all loaded, stop observing
            if (isPlatformBrowser(this.platformId) && this.intersectionObserver) {
              this.intersectionObserver.unobserve(this.scrollTrigger.nativeElement);
            }
          }
          this.cdr.detectChanges();
          this.isLoading = false;
          this.initialLoadDone = true;
          // After initial load (page 2 completed), if the page is now scrollable, ensure observer is active
          // This helps if the initial load didn't fill the screen, but subsequent loads do.
          if (this.currentPage === 2 && isPlatformBrowser(this.platformId) && this.intersectionObserver && this.scrollTrigger) {
            this.intersectionObserver.unobserve(this.scrollTrigger.nativeElement);
            this.intersectionObserver.observe(this.scrollTrigger.nativeElement);
          }
        }, 
        error: err => {
          console.error('Error loading gallery images:', err);
          this.isLoading = false;
          this.initialLoadDone = true;
          if (this.currentPage === 1) {
              this.initialLoadFailed = true;
          }
        }
      });
  }

  private setupIntersectionObserver(): void {
    if (isPlatformBrowser(this.platformId)) {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0
      };

      this.intersectionObserver = new IntersectionObserver((entries) => {
        this.zone.run(() => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.isLoading && !this.allLoaded) {
              console.log('Scroll trigger element is visible. Loading more images...');
              this.loadImages();
            }
          });
        });
      }, options);

      if (this.scrollTrigger) {
        this.intersectionObserver.observe(this.scrollTrigger.nativeElement);
      }
    }
  }

  onImageError(event: Event, image: ImageInfo) {
    console.warn(`Failed to load image: ${this.apiService.imageServerBaseUrl + image.url}`);
    const imgElement = event.target as HTMLImageElement;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    if (isPlatformBrowser(this.platformId) && this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.destroy$.complete();
  }
}
