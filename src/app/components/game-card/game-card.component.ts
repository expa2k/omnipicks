import { Component, HostBinding, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import {
  americanToProb, confidenceLevel, devig, FactorRow, formatAmerican, formatValue, InfoRow,
  initials, injuryReason, pct, signed, splitFactors, sportIcon, teamHue,
} from '../../utils/format';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
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

  /** Lo que prefiere el modelo en cada mercado (ganador, spread, total). */
  get modelPicks(): { key: string; name: string; pick: any }[] {
    const mp = this.game?.model_picks;
    if (!mp) return [];
    const names: Record<string, string> = { winner: 'Ganador', spread: 'Spread', total: 'Total' };
    return ['winner', 'spread', 'total'].filter(k => mp[k]).map(k => ({ key: k, name: names[k], pick: mp[k] }));
  }
  get picksFrozen(): boolean { return !!this.game?.model_picks?.frozen; }
  get recommended(): any[] { return this.modelPicks.filter(m => m.pick.tier === 'recomendado'); }
  get toReview(): any[] { return this.modelPicks.filter(m => m.pick.tier === 'revisar'); }

  tierLabel(t: string): string {
    return ({ recomendado: 'Recomendado', revisar: 'Revisar', sin_valor: 'Sin valor', sin_dato: 'Sin momio' } as Record<string, string>)[t] || t;
  }
  resultIcon(r: string | null): string { return r === 'win' ? '✓' : r === 'loss' ? '✗' : r === 'push' ? '=' : ''; }
  resultLabel(r: string | null): string { return r === 'win' ? 'Acertó' : r === 'loss' ? 'Falló' : r === 'push' ? 'Empate (push)' : ''; }

  bankrollFor(m: { name: string; pick: any }) {
    return { odds: m.pick.odds, prob: Math.round(m.pick.prob * 1000) / 10,
             pick: `${m.name}: ${m.pick.label} · ${this.game.away_team} @ ${this.game.home_team}` };
  }

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

  // ── Modelo NBA v2 ────────────────────────────────────────────────
  get sd() { return this.p?.simulation_details || {}; }
  get isV2(): boolean { return this.sd.model === 'nba_players_v2'; }
  get result() { return this.game?.result || null; }
  logo(side: string): string | null { return side === 'home' ? this.game?.home_logo : this.game?.away_logo; }

  /** Jugadores con duda real (ni fuera ni confirmados). */
  get uncertainCount(): number {
    return (this.sd.injuries || []).filter((i: any) => i.status !== 'Rest-B2B' && i.play_probability > 0 && i.play_probability < 1).length;
  }

  /** Una frase: quién gana según el modelo y según el mercado. */
  get verdict(): { model: string; market: string | null; gap: number | null } | null {
    const p = this.p;
    if (!p || p.predicted_spread === null || p.predicted_spread === undefined) return null;
    const s = p.predicted_spread;
    const favName = s <= 0 ? this.game.home_team : this.game.away_team;
    const prob = s <= 0 ? p.home_win_prob : p.away_win_prob;
    const model = Math.abs(s) < 0.5 ? `parejo (${pct(Math.max(p.home_win_prob, p.away_win_prob))})`
      : `${initials(favName)} gana por ${Math.abs(s).toFixed(1)} (${pct(prob)})`;
    const sp = this.game?.odds?.spread?.home_line;
    let market: string | null = null;
    if (sp !== null && sp !== undefined) {
      market = Math.abs(sp) < 0.5 ? 'parejo' : `${initials(sp < 0 ? this.game.home_team : this.game.away_team)} por ${Math.abs(sp).toFixed(1)}`;
    } else if (this.marketFavorite) {
      const mp = this.marketFavorite === 'home' ? this.market.home : this.market.away;
      market = `${initials(this.marketFavorite === 'home' ? this.game.home_team : this.game.away_team)} favorito (${pct(mp)})`;
    }
    const gap = this.spreadGap;
    return { model, market, gap: gap === null ? null : Math.abs(gap) };
  }

  /** Factores del partido que de verdad usa el modelo v2, en palabras. */
  get whyRows(): { label: string; away: string; home: string; hint?: string }[] {
    const c = this.sd.context || {};
    const t = this.sd.teams || {};
    const rows: { label: string; away: string; home: string; hint?: string }[] = [];
    const yn = (v: any) => (v ? 'Sí' : 'No');
    if (t.home && t.away) {
      rows.push({ label: 'Fuerza de la plantilla hoy', away: signed(t.away.strength_today), home: signed(t.home.strength_today),
                  hint: 'Puntos por 100 posesiones sobre un equipo promedio, con los minutos esperados de hoy' });
      rows.push({ label: 'Pierde por bajas', away: signed(t.away.points_lost), home: signed(t.home.points_lost),
                  hint: 'Puntos de margen contra su plantilla completa' });
    }
    if ('b2b_h' in c) rows.push({ label: '2º partido en 2 días', away: yn(c.b2b_a), home: yn(c.b2b_h) });
    if ('three_in_four_h' in c) rows.push({ label: '3 partidos en 4 noches', away: yn(c.three_in_four_a), home: yn(c.three_in_four_h) });
    if ('travel_a' in c) rows.push({ label: 'Viaje desde su último partido', away: `${Math.round(c.travel_a * 1000)} km`, home: `${Math.round(c.travel_h * 1000)} km` });
    return rows;
  }

  get whyNotes(): string[] {
    const c = this.sd.context || {};
    const notes: string[] = [];
    if (c.rest_diff) notes.push(`${initials(c.rest_diff > 0 ? this.game.home_team : this.game.away_team)} llega con ${Math.abs(c.rest_diff)} día(s) más de descanso.`);
    if (c.east_a >= 2) notes.push(`${initials(this.game.away_team)} viaja ${c.east_a} husos horarios al este.`);
    if (c.altitude_visit) notes.push(`${initials(this.game.away_team)} juega en altura.`);
    if (c.early_season) notes.push('Inicio de temporada: hay más incertidumbre.');
    if (c.playoffs) notes.push('Playoffs: menos puntos y más minutos para los titulares.');
    const adj = this.sd.context_adjustment;
    if (adj && Math.abs(adj.margin) >= 0.5) notes.push(`El contexto mueve el margen ${signed(adj.margin)} pts hacia ${adj.margin > 0 ? initials(this.game.home_team) : initials(this.game.away_team)}.`);
    return notes;
  }

  get v2Info(): { label: string; value: string }[] {
    const s = this.sd;
    const rows: { label: string; value: string }[] = [];
    if (s.most_likely_score) rows.push({ label: 'Marcador más probable', value: `${initials(this.game.away_team)} ${s.most_likely_score[1]} – ${s.most_likely_score[0]} ${initials(this.game.home_team)}` });
    if (s.margin_range_80) rows.push({ label: 'Margen del local (80% de las veces)', value: `${signed(s.margin_range_80[0])} a ${signed(s.margin_range_80[1])}` });
    if (s.total_range_80) rows.push({ label: 'Total (80% de las veces)', value: `${Math.round(s.total_range_80[0])} a ${Math.round(s.total_range_80[1])}` });
    if (s.availability_scenarios > 1) rows.push({ label: 'Escenarios de quién juega', value: String(s.availability_scenarios) });
    if (s.num_simulations) rows.push({ label: 'Simulaciones', value: Number(s.num_simulations).toLocaleString('es-MX') });
    return rows;
  }

  /** Proyección por jugador (puntos, rebotes, asistencias, triples). */
  projFor(side: string): any[] { return this.sd.player_projections?.[side] || []; }
  get hasProj(): boolean { return this.projFor('home').length > 0 || this.projFor('away').length > 0; }

  /** Predicción hecha ya empezado el partido (solo referencia). */
  get late(): any { return this.game?.late_prediction || null; }
  get lateLabel(): string | null {
    const l = this.late;
    if (!l || l.predicted_spread === null || l.predicted_spread === undefined) return null;
    const s = l.predicted_spread;
    const fav = s <= 0 ? this.game.home_team : this.game.away_team;
    return Math.abs(s) < 0.5 ? 'parejo' : `${initials(fav)} por ${Math.abs(s).toFixed(1)}`;
  }

  // ── Bajas compactas ──────────────────────────────────────────────
  openInj = new Set<string>();
  toggleInj(name: string) { this.openInj.has(name) ? this.openInj.delete(name) : this.openInj.add(name); }
  reason(i: any): string { return i.status === 'Rest-B2B' ? '' : injuryReason(i.injury); }

  bankrollParams(pk: any) {
    return { odds: pk.best_odds, prob: pk.model_probability !== null ? Math.round(pk.model_probability * 1000) / 10 : null,
             pick: `${pk.pick_description} · ${this.game.away_team} @ ${this.game.home_team}` };
  }

  toggle() { this.expanded = !this.expanded; }
}
