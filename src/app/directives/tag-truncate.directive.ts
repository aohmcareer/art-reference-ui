import { Directive, ElementRef, Input, Renderer2, AfterViewChecked, HostListener, NgZone, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTagTruncate]',
  standalone: true
})
export class TagTruncateDirective implements AfterViewChecked, OnDestroy {
  @Input() allTags: string[] = []; // The full list of tags

  private isTruncated: boolean = false;
  private resizeTimeout: any;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private zone: NgZone
  ) { }

  ngAfterViewChecked(): void {
    this.zone.runOutsideAngular(() => {
      // Use a small timeout to ensure DOM is stable after rendering
      setTimeout(() => {
        this.checkTruncation();
      }, 0);
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.zone.runOutsideAngular(() => {
        this.checkTruncation();
      });
    }, 100); // Debounce resize events
  }

  private checkTruncation(): void {
    const hostElement = this.el.nativeElement;
    const tagsContainer = hostElement; // The host element is the tags-wrapper div
    const tags = Array.from(tagsContainer.children) as HTMLElement[]; // Get all badge elements

    if (tags.length === 0) {
      this.zone.run(() => {
        this.isTruncated = false;
      });
      this.removeEllipsisFromTags();
      return;
    }

    // 1. Reset all tags to visible and original text
    this.removeEllipsisFromTags();

    // 2. Ensure container forces single line (flexbox) and hides overflow
    this.renderer.setStyle(tagsContainer, 'display', 'flex');
    this.renderer.setStyle(tagsContainer, 'flex-wrap', 'nowrap'); // Prevent wrapping
    this.renderer.setStyle(tagsContainer, 'overflow', 'hidden'); // Hide overflow
    this.renderer.removeStyle(tagsContainer, 'max-height'); // Remove any previous max-height

    // Temporarily make all tags visible to measure total width
    tags.forEach(tag => this.renderer.setStyle(tag, 'display', 'inline-block'));

    // Create a dummy ellipsis tag to measure its width
    const dummyEllipsis = this.renderer.createElement('span');
    this.renderer.addClass(dummyEllipsis, 'badge'); // Apply same styling as real tags
    this.renderer.addClass(dummyEllipsis, 'bg-info');
    this.renderer.addClass(dummyEllipsis, 'text-dark');
    this.renderer.addClass(dummyEllipsis, 'me-1');
    this.renderer.setProperty(dummyEllipsis, 'textContent', '...');
    this.renderer.setStyle(dummyEllipsis, 'visibility', 'hidden'); // Hide it
    this.renderer.setStyle(dummyEllipsis, 'position', 'absolute'); // Don't affect layout
    this.renderer.appendChild(tagsContainer, dummyEllipsis);
    const ellipsisWidth = dummyEllipsis.offsetWidth + parseFloat(getComputedStyle(dummyEllipsis).marginRight || '0') + parseFloat(getComputedStyle(dummyEllipsis).marginLeft || '0');
    this.renderer.removeChild(tagsContainer, dummyEllipsis); // Remove dummy

    let currentWidth = 0;
    let tagsThatFitCount = 0;

    // Iterate forward to find how many tags fit, leaving space for "..."
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const tagStyle = getComputedStyle(tag);
      const tagWidth = tag.offsetWidth + parseFloat(tagStyle.marginRight || '0') + parseFloat(tagStyle.marginLeft || '0');

      // Check if this tag plus the ellipsis would fit
      // If it's the last tag, no need to reserve space for ellipsis
      if (currentWidth + tagWidth + (i < tags.length - 1 ? ellipsisWidth : 0) <= tagsContainer.clientWidth) {
        currentWidth += tagWidth;
        tagsThatFitCount++;
      } else {
        break;
      }
    }

    // If all tags fit, or if only one tag fits and it's the only one, no truncation needed
    if (tagsThatFitCount === tags.length || (tagsThatFitCount === 1 && tags.length === 1)) {
      this.zone.run(() => {
        this.isTruncated = false;
      });
      this.removeEllipsisFromTags();
    } else {
      this.zone.run(() => {
        this.isTruncated = true;
      });

      // If no tags fit at all, or only the first one fits but needs truncation
      if (tagsThatFitCount === 0) {
        tagsThatFitCount = 1; // At least the first tag should be considered for "..."
      }

      // Hide all tags from tagsThatFitCount onwards
      for (let i = tagsThatFitCount; i < tags.length; i++) {
        this.renderer.setStyle(tags[i], 'display', 'none');
      }

      // Apply ellipsis to the last visible tag
      this.addEllipsisToTag(tags[tagsThatFitCount - 1]);
    }
  }

  private addEllipsisToTag(tagElement: HTMLElement): void {
    // Store original text content to restore later
    if (!tagElement.dataset['originalText']) {
      tagElement.dataset['originalText'] = tagElement.textContent || '';
    }
    this.renderer.setProperty(tagElement, 'textContent', '...');
    this.renderer.setStyle(tagElement, 'display', 'inline-block'); // Ensure it's visible
  }

  private removeEllipsisFromTags(): void {
    const tagsContainer = this.el.nativeElement;
    const tags = Array.from(tagsContainer.children) as HTMLElement[];
    tags.forEach(tag => {
      if (tag.dataset['originalText']) {
        this.renderer.setProperty(tag, 'textContent', tag.dataset['originalText']);
        delete tag.dataset['originalText'];
      }
      this.renderer.setStyle(tag, 'display', 'inline-block'); // Ensure all tags are visible
    });
  }

  ngOnDestroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.removeEllipsisFromTags();
  }
}
