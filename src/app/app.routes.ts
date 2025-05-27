import { Routes } from '@angular/router';
import { TimedDrawingsComponent } from './timed-drawings/timed-drawings.component';
import { ImageGalleryComponent } from './image-gallery/image-gallery.component';
import { SessionSummaryComponent } from './session-summary/session-summary.component';

export const routes: Routes = [
  { path: 'timed-drawings', component: TimedDrawingsComponent, title: 'Timed Drawings' },
  { path: 'gallery', component: ImageGalleryComponent, title: 'Image Gallery' },
  { path: 'summary', component: SessionSummaryComponent, title: 'Session Summary' },
  { path: '', redirectTo: '/timed-drawings', pathMatch: 'full' },
  { path: '**', redirectTo: '/timed-drawings' } // Fallback
];