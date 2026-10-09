import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-odds-comparator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './odds-comparator.component.html',
  styleUrl: './odds-comparator.component.css'
})
export class OddsComparatorComponent implements OnInit {
  games: any[] = [];
  sportsbooks: string[] = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetRivers'];

  ngOnInit() {
    this.simulateData();
  }

  simulateData() {
    // Simulando los datos de líneas cruzadas
    this.games = [
      {
        matchup: 'LAL Lakers @ BOS Celtics',
        sport: 'NBA',
        time: '8:00 PM',
        market: 'Moneyline',
        odds: {
          'DraftKings': { home: '-120', away: '+105' },
          'FanDuel': { home: '-125', away: '+100' },
          'BetMGM': { home: '-115', away: '+110', isBestHome: true },
          'Caesars': { home: '-130', away: '-110' },
          'BetRivers': { home: '-125', away: '+115', isBestAway: true }
        }
      },
      {
        matchup: 'Real Madrid vs Barcelona',
        sport: 'SOCCER',
        time: '2:00 PM',
        market: 'Moneyline',
        odds: {
          'DraftKings': { home: '+110', away: '+220', draw: '+250' },
          'FanDuel': { home: '+115', away: '+210', draw: '+260', isBestDraw: true },
          'BetMGM': { home: '+120', away: '+205', draw: '+240', isBestHome: true },
          'Caesars': { home: '+105', away: '+230', draw: '+245', isBestAway: true },
          'BetRivers': { home: '+110', away: '+215', draw: '+250' }
        }
      }
    ];
  }
}
