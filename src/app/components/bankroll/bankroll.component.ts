import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bankroll',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bankroll.component.html',
  styleUrl: './bankroll.component.css'
})
export class BankrollComponent {
  currentBankroll: number = 1000.00;
  
  // Para la calculadora
  calcOdds: number = -110;
  calcProb: number = 55.0;
  kellyFraction: number = 0.25; // Quarter Kelly
  
  suggestedStake: number = 0;
  suggestedAmount: number = 0;

  ngOnInit() {
    this.calculateKelly();
  }

  updateOdds(event: any) {
    this.calcOdds = parseFloat(event.target.value) || 0;
    this.calculateKelly();
  }

  updateProb(event: any) {
    this.calcProb = parseFloat(event.target.value) || 0;
    this.calculateKelly();
  }

  updateFraction(event: any) {
    this.kellyFraction = parseFloat(event.target.value) || 0;
    this.calculateKelly();
  }

  updateBankroll(event: any) {
    this.currentBankroll = parseFloat(event.target.value) || 0;
    this.calculateKelly();
  }

  calculateKelly() {
    // Convertir American Odds a Decimal
    let decimalOdds = 0;
    if (this.calcOdds > 0) {
      decimalOdds = (this.calcOdds / 100) + 1;
    } else if (this.calcOdds < 0) {
      decimalOdds = (100 / Math.abs(this.calcOdds)) + 1;
    } else {
      decimalOdds = 1; // Error
    }

    const p = this.calcProb / 100;
    const q = 1 - p;
    const b = decimalOdds - 1;

    if (b <= 0) {
      this.suggestedStake = 0;
      this.suggestedAmount = 0;
      return;
    }

    // Fórmula Kelly: f* = (bp - q) / b
    let f = (b * p - q) / b;
    
    // Si no hay ventaja, no apostamos
    if (f < 0) f = 0;

    // Ajustar por fracción (Quarter Kelly, Half Kelly)
    f = f * this.kellyFraction;

    this.suggestedStake = f * 100;
    this.suggestedAmount = this.currentBankroll * f;
  }
}
