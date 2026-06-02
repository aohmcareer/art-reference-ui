import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Import shared models first, then API service
import { ImageInfo, FolderInfo, PaginatedResult } from '../core/models/image-info.model';
import { ApiService } from '../services/api.service';
import { TagFilterComponent } from '../tag-filter/tag-filter.component';
import { ImageLazyDirective } from '../shared/directives/image-lazy.directive';

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
    MatTooltipModule,
    ImageLazyDirective
  ],
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  private searchSubject = new Subject<string>();

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
    
    // Debounced search for folder selection
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterFolders(searchTerm);
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupIntersectionObserver();
    }
  }
  
  loadAvailableFolders(): void {
     this.apiService.getFolders(this.activeTags.length > 0 ? this.activeTags : undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: folders => {
          this.availableFolders = folders.sort((a, b) => a.name.localeCompare(b.name));
          if (this.selectedFolder && !this.availableFolders.find(f => f.name === this.selectedFolder)) {
              this.selectedFolder = "";
          }
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Error loading folders:', err);
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
        this.initialLoadFailed = false;
    }

    this.apiService.getGalleryImages(
        this.currentPage, 
        this.pageSize, 
        this.selectedFolder || undefined,
        this.activeTags.length > 0 ? this.activeTags : undefined
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: result => {
          if (result.items && result.items.length > 0) {
            // Filter out duplicates
            const processedNewImages = result.items?.filter((newItem: ImageInfo) =>
                !this.images.some(existingItem =>
                    existingItem.url === newItem.url && existingItem.folderName === newItem.folderName
                )
            );

            this.images = [...this.images, ...processedNewImages];
            this.currentPage++;
          }
          
          if (result.items?.length === 0) {
            this.allLoaded = true;
            if (isPlatformBrowser(this.platformId) && this.intersectionObserver) {
              this.intersectionObserver.unobserve(this.scrollTrigger.nativeElement);
            }
          }
          
          this.initialLoadDone = true;
          
          // After initial load, re-observe if page is scrollable
          if (this.currentPage === 2 && isPlatformBrowser(this.platformId) && this.intersectionObserver && this.scrollTrigger) {
            this.intersectionObserver.unobserve(this.scrollTrigger.nativeElement);
            this.intersectionObserver.observe(this.scrollTrigger.nativeElement);
          }
          
          this.cdr.markForCheck();
        }, 
        error: err => {
          console.error('Error loading gallery images:', err);
          if (this.currentPage === 1) {
              this.initialLoadFailed = true;
          }
          this.cdr.markForCheck();
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

  // TrackBy function for *ngFor to improve performance
  trackByImage(index: number, image: ImageInfo): string {
    return image.url;
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
    this.searchSubject.complete();
    this.destroy$.complete();
  }

  // Folder search filter
  onFolderSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  private filterFolders(searchTerm: string): void {
    if (!searchTerm) {
      return;
    }
    
    const lowerSearch = searchTerm.toLowerCase();
    // This would filter the folders UI, not implemented in template yet
    console.log('Filtering folders by:', searchTerm);
  }
}