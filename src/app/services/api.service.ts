import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ImageInfo {
  fileName: string;
  relativePath: string;
  url: string; // This is the relative path part from BaseServePath (e.g., /References/Folder/image.jpg)
  folderName: string;
  tags: string[];
}

export interface FolderInfo {
  name: string;
  relativePath: string;
  tags: string[];
  imageCount: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  // Publicly accessible base URL for constructing full image paths in templates
  public readonly imageServerBaseUrl = environment.apiUrl.replace('/api', ''); // e.g., https://localhost:5001

  constructor(private http: HttpClient) { }

  getRandomImage(folder?: string, tags?: string[]): Observable<ImageInfo> {
    let params = new HttpParams();
    if (folder) {
      params = params.set('folder', folder);
    }
    if (tags && tags.length > 0) {
      params = params.set('tags', tags.join(','));
    }
    return this.http.get<ImageInfo>(`${this.apiUrl}/images/random`, { params });
  }

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
    return this.http.get<PaginatedResult<ImageInfo>>(`${this.apiUrl}/images/gallery`, { params });
  }

  getFolders(tags?: string[]): Observable<FolderInfo[]> {
    let params = new HttpParams();
    if (tags && tags.length > 0) {
      params = params.set('tags', tags.join(','));
    }
    return this.http.get<FolderInfo[]>(`${this.apiUrl}/images/folders`, { params });
  }

  getAllTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/images/tags`);
  }
}