/** Utilidades de formato compartidas por las vistas. */

export const SPORTS = [
  { key: 'soccer', label: 'Fútbol', icon: 'soccer' },
  { key: 'nba', label: 'NBA', icon: 'basketball' },
  { key: 'nfl', label: 'NFL', icon: 'football' },
  { key: 'mlb', label: 'MLB', icon: 'baseball' },
];

export function sportLabel(sport?: string): string {
  const s = SPORTS.find(x => x.key === (sport || '').toLowerCase());
  return s ? s.label : 'Todos los deportes';
}

export function sportIcon(sport?: string): string {
  return SPORTS.find(x => x.key === (sport || '').toLowerCase())?.icon || 'target';
}

/** Momio americano → probabilidad implícita (con vig). */
export function americanToProb(odds?: number | null): number | null {
  if (odds === null || odds === undefined || odds === 0 || isNaN(odds)) return null;
  return odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100);
}

/** Quita el margen del casino: normaliza las probabilidades para que sumen 1. */
export function devig(probs: (number | null)[]): (number | null)[] {
  const valid = probs.filter((p): p is number => p !== null);
  const total = valid.reduce((a, b) => a + b, 0);
  if (!total || valid.length < 2) return probs.map(() => null);
  return probs.map(p => (p === null ? null : p / total));
}

export function formatAmerican(odds?: number | null): string {
  if (odds === null || odds === undefined || isNaN(odds)) return '—';
  const n = Math.round(odds);
  return n > 0 ? `+${n}` : `${n}`;
}

export function pct(p?: number | null, digits = 0): string {
  if (p === null || p === undefined || isNaN(p)) return '—';
  return `${(p * 100).toFixed(digits)}%`;
}

export function signed(n?: number | null, digits = 1): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const v = Number(n.toFixed(digits));
  return v > 0 ? `+${v.toFixed(digits)}` : v.toFixed(digits);
}

/** Abreviaturas oficiales de la NBA (las iniciales automáticas fallan en varios equipos). */
const TEAM_ABBR: Record<string, string> = {
  'Atlanta Hawks': 'ATL', 'Boston Celtics': 'BOS', 'Brooklyn Nets': 'BKN', 'Charlotte Hornets': 'CHA',
  'Chicago Bulls': 'CHI', 'Cleveland Cavaliers': 'CLE', 'Dallas Mavericks': 'DAL', 'Denver Nuggets': 'DEN',
  'Detroit Pistons': 'DET', 'Golden State Warriors': 'GSW', 'Houston Rockets': 'HOU', 'Indiana Pacers': 'IND',
  'LA Clippers': 'LAC', 'Los Angeles Clippers': 'LAC', 'Los Angeles Lakers': 'LAL', 'Memphis Grizzlies': 'MEM',
  'Miami Heat': 'MIA', 'Milwaukee Bucks': 'MIL', 'Minnesota Timberwolves': 'MIN', 'New Orleans Pelicans': 'NOP',
  'New York Knicks': 'NYK', 'Oklahoma City Thunder': 'OKC', 'Orlando Magic': 'ORL', 'Philadelphia 76ers': 'PHI',
  'Phoenix Suns': 'PHX', 'Portland Trail Blazers': 'POR', 'Sacramento Kings': 'SAC', 'San Antonio Spurs': 'SAS',
  'Toronto Raptors': 'TOR', 'Utah Jazz': 'UTA', 'Washington Wizards': 'WAS',
};

export function initials(name: string): string {
  if (TEAM_ABBR[name]) return TEAM_ABBR[name];
  const words = (name || '').replace(/[^\p{L}\p{N} ]/gu, '').split(' ').filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  // "Los Angeles Lakers" → "LAL"; "New York Knicks" → "NYK"; "Real Madrid" → "RM"
  return words.map(w => w[0]).join('').slice(0, 3).toUpperCase();
}

/** Color estable por nombre de equipo (tono HSL). */
export function teamHue(name: string): number {
  let h = 0;
  for (const c of name || '') h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function confidenceLevel(c?: number | null): { label: string; tone: string } {
  if (c === null || c === undefined) return { label: 'N/D', tone: '' };
  if (c >= 0.8) return { label: 'Alta', tone: 'success' };
  if (c >= 0.65) return { label: 'Media', tone: 'accent' };
  return { label: 'Baja', tone: 'warning' };
}

// ── Factores del partido ────────────────────────────────────────────

/** Etiquetas legibles para los factores que manda el backend. */
const FACTOR_LABELS: Record<string, string> = {
  // NBA
  record: 'Récord', gp: 'Partidos jugados', off_rating: 'Rating ofensivo', def_rating: 'Rating defensivo',
  net_rating: 'Rating neto', pace: 'Ritmo (posesiones)', efg: 'eFG%', tov_pct: 'Pérdidas %',
  orb_pct: 'Rebote ofensivo %', ft_rate: 'Tasa de tiros libres', l10_net_rating: 'Neto últimos 10',
  prev_off_rating: 'Ofensivo temp. pasada', prev_def_rating: 'Defensivo temp. pasada', prev_pace: 'Ritmo temp. pasada',
  b2b: 'Back-to-back',
  // Fútbol
  xg_for: 'Goles a favor / PJ', xga_against: 'Goles en contra / PJ', goals_per_game: 'Goles por partido',
  goals_against_per_game: 'Goles recibidos / PJ', possession: 'Posesión %', form_points: 'Puntos de forma',
  form_string: 'Racha', win_pct: 'Victorias %', draw_pct: 'Empates %', clean_sheet_pct: 'Porterías en cero %',
  failed_to_score_pct: 'Sin anotar %', yellow_per_game: 'Amarillas / PJ', red_total: 'Rojas', formation: 'Formación',
  elo: 'Elo', home_win_pct: 'Victorias de local %', away_win_pct: 'Victorias de visita %', ppda: 'PPDA',
  suspensions: 'Suspendidos',
  // MLB
  pitcher_era: 'ERA del abridor', bullpen_era: 'ERA del bullpen', runs_scored_per_game: 'Carreras anotadas / PJ',
  runs_allowed_per_game: 'Carreras permitidas / PJ', h2h_runs: 'Carreras en H2H',
  // NFL
  points_per_game: 'Puntos / PJ', points_allowed_per_game: 'Puntos permitidos / PJ', yards_per_game: 'Yardas / PJ',
  pass_yards_per_game: 'Yardas por pase / PJ', rush_yards_per_game: 'Yardas por tierra / PJ',
  turnovers_per_game: 'Pérdidas / PJ', sacks_per_game: 'Capturas / PJ', completion_pct: 'Pases completos %',
  third_down_pct: 'Tercera oportunidad %', red_zone_pct: 'Zona roja %',
};

/** Factores generales (no por equipo). */
const INFO_LABELS: Record<string, string> = {
  temporada: 'Temporada', competicion: 'Competición', linea_espn: 'Línea del mercado (ESPN)',
  total_espn: 'Total del mercado (ESPN)', league_pace: 'Ritmo de liga', league_off_rating: 'Rating ofensivo de liga',
  park_factor: 'Factor de estadio', estadio_confirmado: 'Estadio', wind_info: 'Viento',
  h2h_total_games: 'Partidos H2H', h2h_home_wins: 'Victorias local en H2H', h2h_away_wins: 'Victorias visita en H2H',
  h2h_draws: 'Empates H2H',
};

/** Campos que no aportan al usuario (internos o duplicados). */
const HIDDEN = new Set([
  'home_team_name', 'away_team_name', 'api_error', 'home_advantage_weight',
  'home_champions_league_rotation_risk', 'away_champions_league_rotation_risk',
  'home_bullpen_fatigue', 'away_bullpen_fatigue',          // hoy son aleatorios en el backend
]);

export interface FactorRow { key: string; label: string; home: any; away: any; better?: 'home' | 'away' | null; }
export interface InfoRow { key: string; label: string; value: any; }

/** Métricas donde un número MENOR es mejor. */
const LOWER_IS_BETTER = /(def_rating|xga_against|goals_against|against_per_game|tov_pct|era|allowed|turnovers|failed_to_score|yellow|red_total|ppda)/;

export function splitFactors(factors: Record<string, any> | null | undefined): { pairs: FactorRow[]; info: InfoRow[] } {
  const pairs: FactorRow[] = [];
  const info: InfoRow[] = [];
  if (!factors) return { pairs, info };

  const seen = new Set<string>();
  for (const key of Object.keys(factors)) {
    if (HIDDEN.has(key)) continue;
    const m = key.match(/^(home|away)_(.+)$/);
    if (m) {
      const base = m[2];
      if (seen.has(base)) continue;
      seen.add(base);
      const home = factors[`home_${base}`];
      const away = factors[`away_${base}`];
      if (home === undefined && away === undefined) continue;
      let better: 'home' | 'away' | null = null;
      if (typeof home === 'number' && typeof away === 'number' && home !== away && base !== 'gp' && base !== 'b2b' && base !== 'pace' && base !== 'prev_pace') {
        const lowerBetter = LOWER_IS_BETTER.test(base);
        better = (home > away) !== lowerBetter ? 'home' : 'away';
      }
      pairs.push({ key: base, label: FACTOR_LABELS[base] || humanize(base), home, away, better });
    } else if (factors[key] !== null && factors[key] !== undefined && factors[key] !== '') {
      info.push({ key, label: INFO_LABELS[key] || humanize(key), value: factors[key] });
    }
  }
  // Orden: primero los que tienen etiqueta conocida (más relevantes)
  pairs.sort((a, b) => Number(!(a.key in FACTOR_LABELS)) - Number(!(b.key in FACTOR_LABELS)));
  return { pairs, info };
}

export function formatValue(v: any, key = ''): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'number') {
    if (key === 'b2b') return v ? 'Sí' : 'No';
    if (/(efg|tov_pct|orb_pct|ft_rate)$/.test(key) && v <= 1) return `${(v * 100).toFixed(1)}%`;
    if (Number.isInteger(v)) return String(v);
    return Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
  }
  return String(v);
}

function humanize(key: string): string {
  const s = key.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
