import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

// Import shared models
import type { ImageInfo, FolderInfo, PaginatedResult } from '../core/models/image-info.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  // Publicly accessible base URL for constructing full image paths in templates
  public readonly imageServerBaseUrl = environment.apiUrl.replace('/api', ''); // e.g., https://localhost:5001

  constructor(private http: HttpClient) { }

  /*
   * Gets a random image based on optional folder and tag filters
   * folder: Optional folder name to filter by
   * tags: Optional array of tags to filter by
   * returns: Observable of ImageInfo or null if not found
   */
  getRandomImage(folder?: string, tags?: string[]): Observable<ImageInfo | null> {
    let params = new HttpParams();
    if (folder) {
      params = params.set('folder', folder);
    }
    if (tags && tags.length > 0) {
      params = params.set('tags', tags.join(','));
    }
    
    return this.http.get<ImageInfo>(`${this.apiUrl}/images/random`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching random image:', error);
          if (error.status === 404) {
            return throwError(() => new Error('No matching image found for the selected criteria.'));
          }
          return throwError(() => error);
        })
      );
  }

  // Gets paginated images based on filters
  // page: Page number (1-based)
  // pageSize: Number of items per page
  // folder: Optional folder name to filter by
  // tags: Optional array of tags to filter by
  // returns: Observable of PaginatedResult with ImageInfo items
  getGalleryImages(page: number, pageSize: number, folder?: string, tags?: string[]): Observable<PaginatedResult<ImageInfo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (folder) {
      params = params.set('folder', folder);
    }
    if (tags && tags.length > 0) {
      params = params.set('tags', tags.join(','));
    }
    
    return this.http.get<PaginatedResult<ImageInfo>>(`${this.apiUrl}/images/gallery`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching gallery images:', error);
          // Return empty result on error
          return throwError(() => error);
        })
      );
  }

  // Gets all folders with optional tag filtering
  // tags: Optional array of tags to filter by
  // returns: Observable of FolderInfo array
  getFolders(tags?: string[]): Observable<FolderInfo[]> {
    let params = new HttpParams();
    if (tags && tags.length > 0) {
      params = params.set('tags', tags.join(','));
    }
    
    return this.http.get<FolderInfo[]>(`${this.apiUrl}/images/folders`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching folders:', error);
          return throwError(() => error);
        })
      );
  }

  // Gets all unique tags from the repository
  // returns: Observable of string array containing all tags
  getAllTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/images/tags`)
      .pipe(
        catchError(error => {
          console.error('Error fetching tags:', error);
          return throwError(() => error);
        })
      );
  }
}

// Re-export types for convenience
export type { ImageInfo, FolderInfo, PaginatedResult };