// Image information model
export interface ImageInfo {
  fileName: string;
  relativePath: string;
  url: string; // This is the relative path part from BaseServePath (e.g., /References/Folder/image.jpg)
  folderName: string;
  tags: string[];
}

// Folder information model
export interface FolderInfo {
  name: string;
  relativePath: string;
  tags: string[];
  imageCount: number;
}

// Paginated result model
export interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}