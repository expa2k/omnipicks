import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { IconComponent } from '../icon/icon.component';
import { ThemeService } from '../../services/theme.service';
import { ApiService } from '../../services/api.service';
import { SPORTS } from '../../utils/format';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  readonly theme = inject(ThemeService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly sports = SPORTS;
  readonly today = new Date();
  menuOpen = false;
  activeSport: string | null = null;

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.menuOpen = false;
      const tree = this.router.parseUrl(this.router.url);
      const isPicks = tree.root.children['primary']?.segments[0]?.path === 'picks';
      this.activeSport = isPicks ? (tree.queryParams['sport'] || 'all') : null;
    });
  }

  refresh() {
    this.api.refresh();
  }
}
