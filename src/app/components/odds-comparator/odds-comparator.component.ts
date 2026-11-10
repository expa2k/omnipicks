import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { IconComponent } from '../icon/icon.component';
import { americanToProb, devig, formatAmerican, pct, signed, SPORTS, sportIcon } from '../../utils/format';

interface SideRow { label: string; model: number; market: number; diff: number; odds: number | null; }
interface Row { game: any; sides: SideRow[]; maxDiff: number; book: string; }

@Component({
  selector: 'app-odds-comparator',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './odds-comparator.component.html',
  styleUrl: './odds-comparator.component.css',
})
export class OddsComparatorComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  error = false;
  rows: Row[] = [];
  sport = 'all';
  withoutLine = 0;

  readonly sports = [{ key: 'all', label: 'Todos', icon: 'target' }, ...SPORTS];
  readonly pct = pct;
  readonly signed = signed;
  readonly formatAmerican = formatAmerican;
  readonly sportIcon = sportIcon;

  get visible(): Row[] {
    return this.sport === 'all' ? this.rows : this.rows.filter(r => (r.game.sport || '').toLowerCase() === this.sport);
  }

  get avgAbsDiff(): number | null {
    const v = this.visible;
    if (!v.length) return null;
    return v.reduce((a, r) => a + r.maxDiff, 0) / v.length;
  }

  ngOnInit() {
    this.load();
    this.api.refresh$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  load() {
    this.loading = true;
    this.error = false;
    this.api.getGamePredictions().subscribe({
      next: (data: any) => {
        const games = data.games || [];
        this.rows = games.map((g: any) => this.toRow(g)).filter((r: Row | null): r is Row => r !== null)
          .sort((a: Row, b: Row) => b.maxDiff - a.maxDiff);
        this.withoutLine = games.length - this.rows.length;
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; },
    });
  }

  private toRow(g: any): Row | null {
    const p = g.prediction;
    const o = g.odds;
    if (!p || p.matchup_factors?.api_error || !o?.best_home_ml?.odds || !o?.best_away_ml?.odds) return null;

    const [mh, ma, md] = devig([
      americanToProb(o.best_home_ml.odds), americanToProb(o.best_away_ml.odds), americanToProb(o.best_draw?.odds),
    ]);
    if (mh === null || ma === null) return null;

    const sides: SideRow[] = [
      { label: g.away_team, model: p.away_win_prob, market: ma, diff: p.away_win_prob - ma, odds: o.best_away_ml.odds },
    ];
    if (md !== null && p.draw_prob) {
      sides.push({ label: 'Empate', model: p.draw_prob, market: md, diff: p.draw_prob - md, odds: o.best_draw?.odds ?? null });
    }
    sides.push({ label: g.home_team, model: p.home_win_prob, market: mh, diff: p.home_win_prob - mh, odds: o.best_home_ml.odds });

    return { game: g, sides, maxDiff: Math.max(...sides.map(s => Math.abs(s.diff))), book: o.best_home_ml.sportsbook || '' };
  }

  diffTone(d: number): string {
    const a = Math.abs(d);
    if (a < 0.03) return 'same';
    if (a < 0.08) return d > 0 ? 'up' : 'down';
    return d > 0 ? 'up strong' : 'down strong';
  }
}
