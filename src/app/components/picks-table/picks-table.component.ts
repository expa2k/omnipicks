import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { GameCardComponent } from '../game-card/game-card.component';
import { IconComponent } from '../icon/icon.component';
import { sportIcon, sportLabel } from '../../utils/format';

type Filter = 'all' | 'value' | 'high_confidence';

@Component({
  selector: 'app-picks-table',
  standalone: true,
  imports: [CommonModule, GameCardComponent, IconComponent],
  templateUrl: './picks-table.component.html',
  styleUrl: './picks-table.component.css',
})
export class PicksTableComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  games: any[] = [];
  filteredGames: any[] = [];
  loading = true;
  error = false;
  sport: string | undefined;
  activeFilter: Filter = 'all';
  search = '';
  date: string | null = null;
  isToday = true;

  /** 'hoy' o 'mañana jueves 12' según el día que devuelve la API (hora del Este). */
  get dayLabel(): string {
    if (this.isToday || !this.date) return 'hoy';
    const d = new Date(this.date + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  readonly filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'value', label: 'Con recomendación' },
    { key: 'high_confidence', label: 'Confianza alta' },
  ];

  get title() { return sportLabel(this.sport); }
  get icon() { return sportIcon(this.sport); }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.sport = params['sport'];
      this.fetch();
    });
    this.api.refresh$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.fetch());
  }

  fetch() {
    this.loading = true;
    this.error = false;
    this.api.getGamePredictions(this.sport).subscribe({
      next: (data: any) => {
        this.games = data.games || [];
        this.date = data.date || null;
        this.isToday = data.is_today !== false;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar partidos:', err);
        this.games = [];
        this.applyFilter();
        this.error = true;
        this.loading = false;
      },
    });
  }

  setFilter(f: Filter) {
    this.activeFilter = f;
    this.applyFilter();
  }

  onSearch(value: string) {
    this.search = value;
    this.applyFilter();
  }

  count(f: Filter): number {
    return this.games.filter(g => this.matches(g, f)).length;
  }

  applyFilter() {
    const q = this.search.trim().toLowerCase();
    this.filteredGames = this.games.filter(g =>
      this.matches(g, this.activeFilter) &&
      (!q || `${g.home_team} ${g.away_team} ${g.league}`.toLowerCase().includes(q))
    );
  }

  private matches(g: any, f: Filter): boolean {
    if (f === 'value') return (g.value_picks || []).some((pk: any) => pk.tier === 'recomendado');
    if (f === 'high_confidence') return (g.prediction?.confidence || 0) >= 0.8;
    return true;
  }
}
