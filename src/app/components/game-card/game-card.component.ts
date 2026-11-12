import { Component, HostBinding, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import {
  americanToProb, confidenceLevel, devig, FactorRow, formatAmerican, formatValue, InfoRow,
  initials, pct, signed, splitFactors, sportIcon, teamHue,
} from '../../utils/format';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css',
})
export class GameCardComponent implements OnChanges {
  @Input({ required: true }) game: any;
  @Input() compact = false;

  /** Al abrir el análisis, la tarjeta ocupa todo el ancho de la cuadrícula. */
  @HostBinding('class.span-all') expanded = false;
  showAllFactors = false;

  pairs: FactorRow[] = [];
  info: InfoRow[] = [];
  market: { home: number | null; away: number | null; draw: number | null } = { home: null, away: null, draw: null };

  readonly initials = initials;
  readonly teamHue = teamHue;
  readonly pct = pct;
  readonly signed = signed;
  readonly formatAmerican = formatAmerican;
  readonly formatValue = formatValue;
  readonly sportIcon = sportIcon;
  readonly Math = Math;

  ngOnChanges() {
    const split = splitFactors(this.factors);
    this.pairs = split.pairs;
    this.info = split.info;

    const o = this.game?.odds;
    const [h, a, d] = devig([
      americanToProb(o?.best_home_ml?.odds),
      americanToProb(o?.best_away_ml?.odds),
      americanToProb(o?.best_draw?.odds),
    ]);
    this.market = { home: h, away: a, draw: d };
  }

  get p() { return this.game?.prediction; }
  get factors() { return this.p?.matchup_factors; }
  get hasError() { return !!this.factors?.api_error; }
  get hasPrediction() { return !!this.p && !this.hasError; }
  get isSoccer() { return (this.game?.sport || '').toUpperCase() === 'SOCCER'; }
  get confidence() { return confidenceLevel(this.p?.confidence); }
  get favorite(): 'home' | 'away' | 'draw' {
    const p = this.p;
    if (!p) return 'home';
    const d = p.draw_prob || 0;
    if (d > p.home_win_prob && d > p.away_win_prob) return 'draw';
    return p.home_win_prob >= p.away_win_prob ? 'home' : 'away';
  }
  get visiblePairs() { return this.showAllFactors ? this.pairs : this.pairs.slice(0, 8); }
  get scoreDigits() { return this.isSoccer ? '1.1-1' : '1.0-1'; }

  /** "NYK −15.7": el favorito según el spread proyectado. */
  get spreadLabel(): string {
    const s = this.p?.predicted_spread;
    if (s === null || s === undefined) return '—';
    if (Math.abs(s) < 0.05) return 'Parejo';
    const fav = s < 0 ? this.game.home_team : this.game.away_team;
    return `${initials(fav)} −${Math.abs(s).toFixed(1)}`;
  }

  /** Línea del mercado como "PHI −9.5" (de las cuotas guardadas; respaldo: la línea de ESPN del análisis). */
  get marketLine(): string | null {
    const sp = this.game?.odds?.spread;
    if (sp && sp.home_line !== null && sp.home_line !== undefined) {
      if (Math.abs(sp.home_line) < 0.05) return 'Parejo';
      const fav = sp.home_line < 0 ? this.game.home_team : this.game.away_team;
      return `${initials(fav)} −${Math.abs(sp.home_line).toFixed(1)}`;
    }
    return this.factors?.linea_espn || null;
  }
  get marketTotal(): number | null {
    const t = this.game?.odds?.total?.line ?? this.factors?.total_espn;
    return t === null || t === undefined ? null : Number(t);
  }
  get hasMarket(): boolean { return this.market.home !== null || !!this.marketLine || this.marketTotal !== null; }

  /** Favorito según el mercado ('home' | 'away' | null). */
  get marketFavorite(): string | null {
    return this.game?.odds?.market_favorite || (this.market.home !== null && this.market.away !== null
      ? (this.market.home >= this.market.away ? 'home' : 'away') : null);
  }

  /** Diferencia de margen modelo − mercado, en puntos (positivo = el modelo ve mejor al local). */
  get spreadGap(): number | null {
    const sp = this.game?.odds?.spread?.home_line;
    const m = this.p?.predicted_spread;
    if (sp === null || sp === undefined || m === null || m === undefined) return null;
    return sp - m;
  }

  get recommended(): any[] { return (this.game?.value_picks || []).filter((pk: any) => pk.tier === 'recomendado'); }
  get toReview(): any[] { return (this.game?.value_picks || []).filter((pk: any) => pk.tier === 'revisar'); }

  marketLabel(m: string): string {
    return ({ moneyline: 'Ganador', spread: 'Spread', over_under: 'Total' } as Record<string, string>)[m] || '';
  }

  /** Diferencia modelo − mercado (en puntos porcentuales) para el lado favorito del modelo. */
  get edgeVsMarket(): number | null {
    const side = this.favorite;
    const m = side === 'home' ? this.market.home : side === 'away' ? this.market.away : this.market.draw;
    const prob = side === 'home' ? this.p?.home_win_prob : side === 'away' ? this.p?.away_win_prob : this.p?.draw_prob;
    if (m === null || prob === undefined || prob === null) return null;
    return prob - m;
  }

  get simInfo(): { label: string; value: string }[] {
    const s = this.p?.simulation_details || {};
    const rows: { label: string; value: string }[] = [];
    if (s.num_simulations) rows.push({ label: 'Simulaciones', value: Number(s.num_simulations).toLocaleString('es-MX') });
    if (s.expected_possessions) rows.push({ label: 'Posesiones esperadas', value: String(s.expected_possessions) });
    if (s.home_court_pts) rows.push({ label: 'Ventaja de local', value: `${s.home_court_pts} pts` });
    if (s.margin_range_80) rows.push({ label: 'Margen (80% de las veces)', value: `${signed(s.margin_range_80[0])} a ${signed(s.margin_range_80[1])}` });
    if (this.p?.model_name) rows.push({ label: 'Modelo', value: this.p.model_name });
    return rows;
  }

  /** Bajas con su impacto (modelo NBA v2): puntos de margen que pierde su equipo si no juega. */
  get injuries(): any[] {
    return (this.p?.simulation_details?.injuries || []).filter((i: any) => i.usual_minutes >= 8 || Math.abs(i.impact_if_out) >= 0.5);
  }
  injuriesFor(side: string): any[] { return this.injuries.filter((i) => i.team === side); }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      'Out For Season': 'Fuera (temporada)', Out: 'Fuera', Doubtful: 'Duda', Questionable: 'Duda',
      'Day-To-Day': 'Día a día', Probable: 'Probable', 'Rest-B2B': 'Posible descanso (2º día seguido)',
    };
    return map[s] || s;
  }

  sourceLabel(i: any): string {
    return ({ nba: 'reporte oficial NBA', espn: 'ESPN', modelo: 'historial del jugador' } as Record<string, string>)[i.source] || '';
  }

  minutesTo(i: any): string {
    return (i.minutes_to || []).map((m: any) => `${m.player}${m.position ? ' · ' + m.position : ''} (+${Math.round(m.minutes)})`).join(', ');
  }

  /** Puntos de margen que pierde el equipo hoy por sus bajas (contra su plantilla completa). */
  teamLoss(side: string): number | null {
    const v = this.p?.simulation_details?.teams?.[side]?.points_lost;
    return v === undefined || v === null ? null : v;
  }

  onOffLabel(i: any): string | null {
    const o = i.on_off;
    if (!o || (o.on_net === null && o.off_net === null)) return null;
    const f = (v: number | null) => (v === null ? '—' : signed(v));
    return `Con él en cancha ${f(o.on_net)} · sin él ${f(o.off_net)} (por 100 posesiones, ${o.on_poss} pos. con él)`;
  }

  toggle() { this.expanded = !this.expanded; }
}
