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
    const names: Record<string, string> = { winner: this.isSoccer ? 'Resultado' : 'Ganador', spread: this.isSoccer ? 'Hándicap' : 'Spread', total: this.isSoccer ? 'Goles' : 'Total', btts: 'Ambos anotan' };
    return ['winner', 'spread', 'total', 'btts'].filter(k => mp[k]).map(k => ({ key: k, name: names[k], pick: mp[k] }));
  }
  get picksFrozen(): boolean { return !!this.game?.model_picks?.frozen; }
  get recommended(): any[] { return this.modelPicks.filter(m => m.pick.tier === 'recomendado'); }
  get toReview(): any[] { return this.modelPicks.filter(m => m.pick.tier === 'revisar'); }

  confLabel(c: string | undefined): string {
    return c === 'sin_linea' ? 'Sin línea aún' : 'Confianza ' + (c || 'baja');
  }

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
      'Day-To-Day': 'Día a día', Probable: 'Probable', 'Injured Reserve': 'Lista de lesionados (IR)', 'Rest-B2B': 'Posible descanso (2º día seguido)',
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
  get isNflV2(): boolean { return this.sd.model === 'nfl_v2'; }
  get isSoccerV2(): boolean { return this.sd.model === 'soccer_v2'; }
  get isMlbV2(): boolean { return this.sd.model === 'mlb_v2'; }
  /** Bloque "Por qué este pronóstico" y "Simulación" (modelos nuevos de NBA, NFL y fútbol). */
  get hasWhy(): boolean { return this.isV2 || this.isNflV2 || this.isSoccerV2 || this.isMlbV2; }
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
    if (this.isNflV2) return this.nflWhyRows;
    if (this.isSoccerV2) return this.soccerWhyRows;
    if (this.isMlbV2) return this.mlbWhyRows;
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
    if (this.isNflV2) return this.nflWhyNotes;
    if (this.isSoccerV2) return this.soccerWhyNotes;
    if (this.isMlbV2) return this.mlbWhyNotes;
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

  // ── MLB v2 ───────────────────────────────────────────────────────
  private get mlbWhyRows(): { label: string; away: string; home: string; hint?: string }[] {
    const s = this.sd;
    const xr = s.expected_runs || {};
    const f2 = (v: any) => (v === null || v === undefined ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(2));
    return [
      { label: 'Abridor', away: s.away_starter || 'por anunciar', home: s.home_starter || 'por anunciar' },
      { label: 'Rating del abridor', away: f2(s.away_starter_rating), home: f2(s.home_starter_rating),
        hint: 'Cuántas carreras le quita al rival (escala logarítmica), ajustado por rival, parque y alineación' },
      { label: 'Carreras esperadas', away: Number(xr.away ?? 0).toFixed(2), home: Number(xr.home ?? 0).toFixed(2) },
      { label: 'Alineación con ventaja de mano', away: pct(s.platoon?.away), home: pct(s.platoon?.home),
        hint: 'Fracción de bateadores que tienen ventaja contra la mano del abridor rival' },
    ];
  }

  private get mlbWhyNotes(): string[] {
    const s = this.sd;
    const notes: string[] = [];
    if (!s.home_lineup_official || !s.away_lineup_official) notes.push('Alineación oficial aún no publicada: se usa la última del equipo.');
    if (s.park) notes.push(`Parque: ${s.park} (su efecto en las carreras se aprende del histórico).`);
    return notes;
  }

  // ── Fútbol v2 ────────────────────────────────────────────────────
  private get soccerWhyRows(): { label: string; away: string; home: string; hint?: string }[] {
    const s = this.sd;
    const xg = s.expected_goals || {};
    const r = s.ratings || {};
    const f2 = (v: any) => (v === null || v === undefined ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(2));
    const rows: { label: string; away: string; home: string; hint?: string }[] = [
      { label: 'Goles esperados', away: Number(xg.away ?? 0).toFixed(2), home: Number(xg.home ?? 0).toFixed(2),
        hint: 'Goles que se espera que anote cada equipo (Dixon-Coles con goles y tiros a puerta)' },
    ];
    if (r.home?.attack !== undefined || r.away?.attack !== undefined) {
      rows.push({ label: 'Ataque', away: f2(r.away?.attack), home: f2(r.home?.attack), hint: 'Sobre un equipo medio de su liga, ajustado por rival (escala logarítmica de goles)' });
      rows.push({ label: 'Defensa', away: f2(r.away?.defense), home: f2(r.home?.defense), hint: 'Positivo = recibe menos goles que un equipo medio' });
    }
    if (r.home_league) {
      rows.push({ label: 'Liga', away: r.away_league, home: r.home_league });
      rows.push({ label: 'Fuerza de su liga', away: f2(r.away_league_strength), home: f2(r.home_league_strength),
                  hint: 'Aprendida de los cruces en Champions y Europa League' });
    }
    return rows;
  }

  private get soccerWhyNotes(): string[] {
    const s = this.sd;
    const notes: string[] = [];
    if (s.most_likely_score) notes.push(`Marcador más probable: ${initials(this.game.home_team)} ${s.most_likely_score[0]}–${s.most_likely_score[1]} ${initials(this.game.away_team)} (${pct(s.most_likely_prob)}).`);
    if (s.over_2_5 !== undefined) notes.push(`Más de 2.5 goles: ${pct(s.over_2_5)} · ambos anotan: ${pct(s.btts)}.`);
    if (s.ratings?.home_league === 'Otras ligas' || s.ratings?.away_league === 'Otras ligas')
      notes.push('Un equipo es de una liga que no seguimos: su nivel sale solo de sus partidos de copa, hay más incertidumbre.');
    return notes;
  }

  // ── Modelo NFL v2 ────────────────────────────────────────────────
  private get nflWhyRows(): { label: string; away: string; home: string; hint?: string }[] {
    const s = this.sd;
    const hq = s.home_qb || {}, aq = s.away_qb || {};
    const f2 = (v: any) => (v === null || v === undefined ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(2));
    return [
      { label: 'QB titular', away: aq.name || '—', home: hq.name || '—' },
      { label: 'Estado', away: this.qbStatus(aq), home: this.qbStatus(hq),
        hint: 'Reporte de lesiones de ESPN. En duda: el pronóstico mezcla al titular y a su suplente según la probabilidad de que juegue' },
      { label: 'Rating del QB', away: f2(aq.rating), home: f2(hq.rating),
        hint: 'EPA por dropback sobre la media de la liga (pases, sacks y scrambles), lo reciente pesa más' },
      { label: 'Cambio contra su QB habitual', away: signed(aq.adjustment_pts_epa), home: signed(hq.adjustment_pts_epa),
        hint: 'EPA por partido que gana o pierde el equipo por jugar con este QB y no con el que ha usado' },
      { label: 'Rating del equipo (EPA)', away: f2(s.away_net_epa), home: f2(s.home_net_epa),
        hint: 'EPA por jugada a favor menos en contra, ajustado por rival' },
      { label: 'Rating por marcador', away: signed(s.away_points_rating), home: signed(s.home_points_rating),
        hint: 'Puntos sobre un equipo promedio, ajustado por rival' },
    ];
  }

  get nflInj(): any { return this.sd.player_injuries && this.sd.player_injuries.home_injuries ? this.sd.player_injuries : null; }
  nflGroup(g: string): string {
    return ({ OL: 'línea ofensiva', DL: 'línea defensiva', LB: 'linebacker', DB: 'secundaria', WR: 'receptor',
              TE: 'ala cerrada', RB: 'corredor', QB: 'QB' } as Record<string, string>)[g] || g;
  }
  practiceLabel(p: string | null): string {
    const s = (p || '').toLowerCase();
    return s.startsWith('full') ? 'entrenó completo' : s.startsWith('limited') ? 'entrenó limitado' : s.startsWith('did not') ? 'no entrenó' : '';
  }

  private qbStatus(q: any): string {
    const st = (q.status || 'Active').toLowerCase();
    const es: Record<string, string> = { active: 'Disponible', questionable: 'En duda', doubtful: 'Duda seria', out: 'Fuera' };
    const label = es[st] || q.status || 'Disponible';
    return q.play_prob !== undefined && q.play_prob < 1 ? `${label} · ${Math.round(q.play_prob * 100)}%` : label;
  }

  private get nflWhyNotes(): string[] {
    const s = this.sd;
    const notes: string[] = [];
    const es: Record<string, string> = { 'Out': 'fuera', 'Injured Reserve': 'en la lista de lesionados (IR)', 'Doubtful': 'en duda seria' };
    for (const [side, team] of [['away', this.game.away_team], ['home', this.game.home_team]] as const) {
      const q = s[`${side}_qb`] || {};
      for (const o of q.ruled_out || []) notes.push(`${o.name} (${initials(team)}) está ${es[o.status] || (o.status || '').toLowerCase()}: no se cuenta.`);
      if (q.changed && q.name) notes.push(`${initials(team)} juega con ${q.name} en lugar de ${q.projected}.`);
      if (q.play_prob !== undefined && q.play_prob < 1 && q.backup)
        notes.push(`${q.name} está en duda: el pronóstico supone ${Math.round(q.play_prob * 100)}% que juega y ${Math.round((1 - q.play_prob) * 100)}% ${q.backup}.`);
      if (q.name && !q.known) notes.push(`${q.name} (${initials(team)}) casi no tiene jugadas: se toma como QB suplente.`);
      else if (q.name && Math.abs(q.adjustment_pts_epa) >= 1.5)
        notes.push(`${initials(team)} juega con ${q.name}, ${q.adjustment_pts_epa > 0 ? 'mejor' : 'peor'} que el QB con el que ha jugado.`);
    }
    if (s.home_field) notes.push(`Ventaja de local: ${signed(s.home_field)} pts.`);
    if (s.indoor) notes.push('Se juega bajo techo: suele haber más puntos.');
    else {
      const src = s.weather_source ? ` (${s.weather_source})` : '';
      if (s.rain >= 0.3) notes.push(`${s.precipitation_pct ?? Math.round(s.rain * 100)}% de probabilidad de lluvia${src}: el total baja ~${(3.4 * s.rain).toFixed(1)} pts.`);
      if (s.snow >= 0.3) notes.push(`Posible nieve${src}.`);
      if (s.wind >= 15) notes.push(`Viento de ${s.wind} mph: baja el total.`);
      if (s.temp !== null && s.temp !== undefined && s.temp <= 32) notes.push(`Frío: ${s.temp}°F.`);
    }
    return notes;
  }

  get v2Info(): { label: string; value: string }[] {
    const s = this.sd;
    const rows: { label: string; value: string }[] = [];
    if (this.isSoccerV2) {
      if (s.most_likely_score) rows.push({ label: 'Marcador más probable', value: `${s.most_likely_score[0]}–${s.most_likely_score[1]} (${pct(s.most_likely_prob)})` });
      if (s.over_2_5 !== undefined) rows.push({ label: 'Más de 2.5 goles', value: pct(s.over_2_5) });
      if (s.btts !== undefined) rows.push({ label: 'Ambos anotan', value: pct(s.btts) });
      return rows;
    }
    if (this.isNflV2 && this.p?.predicted_spread !== undefined) {
      const m = -this.p.predicted_spread, t = this.p.predicted_total;
      const z = 1.2816;
      rows.push({ label: 'Margen del local (80% de las veces)', value: `${signed(m - z * s.sigma_margin)} a ${signed(m + z * s.sigma_margin)}` });
      if (t) rows.push({ label: 'Total (80% de las veces)', value: `${Math.round(t - z * s.sigma_total)} a ${Math.round(t + z * s.sigma_total)}` });
      rows.push({ label: 'Semana', value: String(s.week) });
      return rows;
    }
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
