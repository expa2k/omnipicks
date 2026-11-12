import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { IconComponent } from '../icon/icon.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-bankroll',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './bankroll.component.html',
  styleUrl: './bankroll.component.css',
})
export class BankrollComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  /** Recomendación que llenó la calculadora (si se llegó desde un partido). */
  fromPick: string | null = null;
  perf: any = null;

  get live() { return this.perf?.models?.nba_players_v2 || null; }
  get liveV1() { return this.perf?.models?.nba_possessions_v1 || null; }

  currentBankroll = 1000;
  calcOdds = -110;
  calcProb = 55;
  kellyFraction = 0.25;

  suggestedStake = 0;
  suggestedAmount = 0;
  impliedProb = 0;
  edge = 0;
  ev = 0;
  payout = 0;

  readonly fractions = [
    { value: 1, label: 'Completo' },
    { value: 0.5, label: '½' },
    { value: 0.25, label: '¼' },
    { value: 0.125, label: '⅛' },
  ];

  get fractionHint(): string {
    switch (this.kellyFraction) {
      case 1: return 'Kelly completo: muy agresivo, no recomendado.';
      case 0.5: return 'Medio Kelly: moderado.';
      case 0.25: return 'Un cuarto de Kelly: conservador (recomendado).';
      default: return 'Un octavo de Kelly: muy conservador.';
    }
  }

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('odds')) this.calcOdds = parseFloat(q.get('odds')!) || this.calcOdds;
    if (q.get('prob')) this.calcProb = parseFloat(q.get('prob')!) || this.calcProb;
    this.fromPick = q.get('pick');
    try {
      const saved = parseFloat(localStorage.getItem('omnipicks-bankroll') || '');
      if (saved > 0) this.currentBankroll = saved;
    } catch { /* modo privado */ }
    this.calculate();
    this.api.getNbaPerformance().pipe(catchError(() => of(null))).subscribe(p => (this.perf = p));
  }

  updateOdds(e: Event) { this.calcOdds = parseFloat((e.target as HTMLInputElement).value) || 0; this.calculate(); }
  updateProb(e: Event) { this.calcProb = parseFloat((e.target as HTMLInputElement).value) || 0; this.calculate(); }
  updateBankroll(e: Event) {
    this.currentBankroll = parseFloat((e.target as HTMLInputElement).value) || 0;
    try { localStorage.setItem('omnipicks-bankroll', String(this.currentBankroll)); } catch { /* modo privado */ }
    this.calculate();
  }
  setFraction(v: number) { this.kellyFraction = v; this.calculate(); }

  private calculate() {
    const o = this.calcOdds;
    const decimal = o > 0 ? o / 100 + 1 : o < 0 ? 100 / Math.abs(o) + 1 : 1;
    const b = decimal - 1;
    const p = Math.min(Math.max(this.calcProb / 100, 0), 1);

    this.impliedProb = decimal > 1 ? 100 / decimal : 0;
    this.edge = this.calcProb - this.impliedProb;
    this.ev = p * b - (1 - p);

    if (b <= 0) { this.suggestedStake = 0; this.suggestedAmount = 0; this.payout = 0; return; }

    const kelly = Math.max(0, (b * p - (1 - p)) / b) * this.kellyFraction;
    this.suggestedStake = kelly * 100;
    this.suggestedAmount = this.currentBankroll * kelly;
    this.payout = this.suggestedAmount * b;
  }
}
