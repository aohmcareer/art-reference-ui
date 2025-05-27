import { Component, EventEmitter, OnInit, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-tag-filter',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './tag-filter.component.html',
  styleUrls: ['./tag-filter.component.css']
})
export class TagFilterComponent implements OnInit, OnChanges {
  allAvailableTags: string[] = [];
  filteredAvailableTags: string[] = [];
  selectedTags: Set<string> = new Set();
  searchTerm: string = '';

  @Input() externallySelectedTags: string[] = [];
  @Output() tagsSelected = new EventEmitter<string[]>();

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.getAllTags().subscribe(tags => {
      this.allAvailableTags = tags.sort((a, b) => a.localeCompare(b));
      this.updateFromExternalSelection();
      this.filterTags();
    });
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['externallySelectedTags'] && this.allAvailableTags.length > 0) {
      this.updateFromExternalSelection();
      this.filterTags();
    }
  }

  private updateFromExternalSelection(): void {
    this.selectedTags = new Set(this.externallySelectedTags);
  }

  filterTags(): void {
    if (!this.searchTerm) {
      this.filteredAvailableTags = [...this.allAvailableTags];
    } else {
      const lowerSearchTerm = this.searchTerm.toLowerCase();
      this.filteredAvailableTags = this.allAvailableTags.filter(tag =>
        tag.toLowerCase().includes(lowerSearchTerm)
      );
    }
  }

  onTagChange(tag: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedTags.add(tag);
    } else {
      this.selectedTags.delete(tag);
    }
  }

  applySelection(): void {
    this.tagsSelected.emit(Array.from(this.selectedTags));
  }

  clearSelection(): void {
    this.selectedTags.clear();
    this.searchTerm = '';
    this.filterTags();
    this.tagsSelected.emit([]);
  }
}