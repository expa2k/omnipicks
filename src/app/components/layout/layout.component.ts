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
  readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly sports = SPORTS;
  readonly today = new Date();

  /** Fecha del encabezado: el día que muestra la cartelera (si ya se cargó), si no, hoy. */
  get headerDate(): Date {
    const s = this.api.slate();
    return s ? new Date(s.date + 'T12:00:00') : this.today;
  }
  get headerIsToday(): boolean { return this.api.slate()?.isToday !== false; }
  menuOpen = false;
  activeSport: string | null = null;

  constructor() {
    // Para que el encabezado muestre el día de la cartelera aunque se entre directo a otra página
    if (!this.api.slate()) this.api.getGamePredictions().subscribe({ error: () => {} });
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
