import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ImageInfo } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SessionStateService {
  private viewedImagesSubject = new BehaviorSubject<ImageInfo[]>([]);
  viewedImages$ = this.viewedImagesSubject.asObservable();

  constructor() { }

  addImageViewed(image: ImageInfo) {
    const currentImages = this.viewedImagesSubject.value;
    // Avoid duplicates based on URL and folderName combination
    if (!currentImages.find(img => img.url === image.url && img.folderName === image.folderName)) {
      this.viewedImagesSubject.next([...currentImages, image]);
    }
  }

  clearViewedImages() {
    this.viewedImagesSubject.next([]);
  }

  getViewedImages(): ImageInfo[] {
    return this.viewedImagesSubject.value;
  }
}