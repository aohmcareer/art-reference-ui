import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ApiService, ImageInfo, FolderInfo } from '../services/api.service';
import { TagFilterComponent } from '../tag-filter/tag-filter.component';

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InfiniteScrollModule,
    TagFilterComponent
  ],
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.css']
})
export class ImageGalleryComponent implements OnInit, OnDestroy {
  images: ImageInfo[] = [];
  currentPage: number = 1;
  pageSize: number = 24; 
  isLoading: boolean = false;
  allLoaded: boolean = false; 
  initialLoadDone: boolean = false;
  initialLoadFailed: boolean = false;

  private destroy$ = new Subject<void>();

  activeTags: string[] = [];
  availableFolders: FolderInfo[] = [];
  selectedFolder: string = "";

  constructor(public apiService: ApiService) { }

  ngOnInit(): void {
    this.loadAvailableFolders();
    this.loadImages();
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
    // Brief timeout to allow UI to reflect reset before new load starts
    // and to prevent multiple rapid calls if filters change quickly
    setTimeout(() => {
        if (!this.isLoading) { // Double check not already loading from another source
            this.loadImages();
        }
    }, 100); 
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
            const newImages = result.items.filter(newItem => 
                !this.images.some(existingItem => 
                    existingItem.url === newItem.url && existingItem.folderName === newItem.folderName
                )
            );
            this.images = [...this.images, ...newImages];
            this.currentPage++;
          }
          // Check if all images are loaded
          if (this.images.length >= result.totalCount || (result.items.length === 0 && this.currentPage > 1) || (result.totalCount === 0) ) {
            this.allLoaded = true;
          }
          this.isLoading = false;
          this.initialLoadDone = true;
        }, 
        error: err => {
          console.error('Error loading gallery images:', err);
          this.isLoading = false;
          this.initialLoadDone = true; // Mark as done even on error to show message
          if (this.currentPage === 1) {
              this.initialLoadFailed = true;
          }
        }
      });
  }

  onScroll(): void {
    if (!this.isLoading && !this.allLoaded && this.initialLoadDone) { // Only load if not already loading, not all loaded, and initial load attempt is done
        this.loadImages();
    }
  }

  onImageError(event: Event, image: ImageInfo) {
    console.warn(`Failed to load image: ${this.apiService.imageServerBaseUrl + image.url}`);
    const imgElement = event.target as HTMLImageElement;
    // Down the road, replace with a placeholder image or style?
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}