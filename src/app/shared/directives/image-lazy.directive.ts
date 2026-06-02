import { Directive, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

// Directive for lazy loading images
// Uses the browser's native 'loading="lazy"' attribute when supported
@Directive({
  selector: '[appImageLazy]'
})
export class ImageLazyDirective implements OnInit, OnChanges {
  @Input() appImageLazy = '';
  @Input() placeholderUrl = '/placeholder.jpg';

  private elementRef: ElementRef<HTMLImageElement>;

  constructor(elementRef: ElementRef<HTMLImageElement>) {
    this.elementRef = elementRef;
  }

  ngOnInit(): void {
    // Set lazy loading attribute for native browser support
    const img = this.elementRef.nativeElement as HTMLImageElement;
    
    // Use native lazy loading when available
    if ('loading' in img) {
      img.loading = 'lazy';
    }
    
    // Add placeholder handling
    this.addPlaceholderSupport(img);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appImageLazy']) {
      const img = this.elementRef.nativeElement as HTMLImageElement;
      
      if ('loading' in img) {
        img.loading = 'lazy';
      }
      
      // If image source changes, reset error state
      if (!img.complete && !img.src) {
        this.addPlaceholderSupport(img);
      }
    }
  }

  // Adds placeholder support for images that haven't loaded yet
  private addPlaceholderSupport(img: HTMLImageElement): void {
    // Show placeholder initially (optional - could use CSS background instead)
    if (!img.src && this.placeholderUrl) {
      img.style.opacity = '0.5';
    }

    // Reset opacity when image loads
    img.addEventListener('load', () => {
      img.style.opacity = '';
    });

    // Handle errors gracefully
    img.addEventListener('error', () => {
      console.warn(`Failed to load image: ${img.src}`);
      img.alt = 'Image failed to load';
    });
  }

  @HostListener('load')
  onLoad(): void {
    const img = this.elementRef.nativeElement as HTMLImageElement;
    img.style.opacity = '';
  }

  @HostListener('error')
  onError(): void {
    console.warn(`Failed to load image: ${this.elementRef.nativeElement.src}`);
  }
}