import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-picks-table',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './picks-table.component.html',
  styleUrl: './picks-table.component.css',
  providers: [ApiService]
})
export class PicksTableComponent implements OnInit {
  games: any[] = [];
  filteredGames: any[] = [];
  loading = true;
  currentSport = 'TODOS LOS DEPORTES';
  activeFilter = 'all';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const sport = params['sport'];
      if (sport) {
        this.currentSport = sport.toUpperCase();
      } else {
        this.currentSport = 'TODOS LOS DEPORTES';
      }
      this.fetchGames(sport);
    });
  }

  fetchGames(sport?: string) {
    this.loading = true;
    this.apiService.getGamePredictions(sport).subscribe({
      next: (data: any) => {
        this.games = data.games || [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching game predictions:', err);
        this.simulateData();
        this.loading = false;
      }
    });
  }

  simulateData() {
    this.games = [
      {
        id: '1',
        sport: 'NBA',
        league: 'NBA',
        home_team: 'BOS Celtics',
        away_team: 'LAL Lakers',
        game_time: '2026-06-13T20:00:00',
        venue: 'TD Garden',
        status: 'scheduled',
        prediction: {
          home_win_prob: 0.62,
          away_win_prob: 0.38,
          draw_prob: 0,
          predicted_home_score: 112,
          predicted_away_score: 105,
          confidence: 0.82,
          matchup_factors: {
            home_offensive_rating: 118.5,
            away_defensive_rating: 110.2,
            pace_factor: 100.3,
            home_court_advantage: 3.2
          },
          simulation_details: {
            num_simulations: 10000,
            avg_simulated_total: 217.4,
            home_implied_runs: 112,
            away_implied_runs: 105
          }
        },
        odds: {
          best_home_ml: -150,
          best_away_ml: +130,
          best_draw: null
        },
        value_pick: {
          pick_description: 'BOS Celtics ML',
          model_edge: 0.08,
          expected_value: 0.06,
          value_rating: 4,
          best_odds: '-150',
          best_sportsbook: 'DraftKings'
        }
      },
      {
        id: '2',
        sport: 'NBA',
        league: 'NBA',
        home_team: 'DEN Nuggets',
        away_team: 'MIA Heat',
        game_time: '2026-06-13T21:30:00',
        venue: 'Ball Arena',
        status: 'scheduled',
        prediction: {
          home_win_prob: 0.55,
          away_win_prob: 0.45,
          draw_prob: 0,
          predicted_home_score: 108,
          predicted_away_score: 103,
          confidence: 0.68,
          matchup_factors: {
            home_offensive_rating: 115.1,
            away_defensive_rating: 112.6,
            altitude_factor: 1.05
          },
          simulation_details: {
            num_simulations: 10000,
            avg_simulated_total: 211.0,
            home_implied_runs: 108,
            away_implied_runs: 103
          }
        },
        odds: {
          best_home_ml: -200,
          best_away_ml: +170,
          best_draw: null
        },
        value_pick: null
      },
      {
        id: '3',
        sport: 'SOCCER',
        league: 'La Liga',
        home_team: 'Real Madrid',
        away_team: 'Barcelona',
        game_time: '2026-06-14T14:00:00',
        venue: 'Santiago Bernabéu',
        status: 'scheduled',
        prediction: {
          home_win_prob: 0.42,
          away_win_prob: 0.30,
          draw_prob: 0.28,
          predicted_home_score: 2.1,
          predicted_away_score: 1.6,
          confidence: 0.58,
          matchup_factors: {
            home_xg_avg: 2.1,
            away_xg_avg: 1.8,
            head_to_head_home_wins: 5,
            head_to_head_draws: 3
          },
          simulation_details: {
            num_simulations: 10000,
            avg_simulated_total: 3.7,
            home_xg_simulated: 2.1,
            away_xg_simulated: 1.6
          }
        },
        odds: {
          best_home_ml: +110,
          best_away_ml: +250,
          best_draw: +220
        },
        value_pick: {
          pick_description: 'Over 2.5 Goles',
          model_edge: 0.10,
          expected_value: 0.09,
          value_rating: 5,
          best_odds: '+105',
          best_sportsbook: 'BetMGM'
        }
      }
    ];
    this.applyFilter();
  }

  // --- Filter logic ---

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    switch (this.activeFilter) {
      case 'value':
        this.filteredGames = this.games.filter(g => g.value_picks && g.value_picks.length > 0);
        break;
      case 'high_confidence':
        this.filteredGames = this.games.filter(g => g.prediction?.confidence > 0.8);
        break;
      default:
        this.filteredGames = [...this.games];
    }
  }

  // --- Row expand ---

  expandedGameId: string | null = null;

  toggleRow(gameId: string) {
    this.expandedGameId = this.expandedGameId === gameId ? null : gameId;
  }

  // --- Helpers ---

  getConfidenceLabel(confidence: number): string {
    if (confidence > 0.8) return 'Alta';
    if (confidence > 0.65) return 'Media';
    return 'Baja';
  }

  getConfidenceClass(confidence: number): string {
    if (confidence > 0.8) return 'confidence-alta';
    if (confidence > 0.65) return 'confidence-media';
    return 'confidence-baja';
  }

  getHighestProb(prediction: any): string {
    const probs = [
      { label: 'home', val: prediction.home_win_prob },
      { label: 'away', val: prediction.away_win_prob },
      { label: 'draw', val: prediction.draw_prob || 0 }
    ];
    return probs.sort((a, b) => b.val - a.val)[0].label;
  }

  formatOdds(oddsObj: any): string {
    if (!oddsObj || oddsObj.odds === null || oddsObj.odds === undefined) return '—';
    const odds = oddsObj.odds;
    return odds > 0 ? `+${odds}` : `${odds}`;
  }

  getRatingStars(rating: number): string {
    return '⭐'.repeat(rating);
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  formatKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  isNumber(val: any): boolean {
    return typeof val === 'number' && !isNaN(val);
  }
}
