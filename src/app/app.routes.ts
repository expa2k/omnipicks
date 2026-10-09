import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PicksTableComponent } from './components/picks-table/picks-table.component';
import { OddsComparatorComponent } from './components/odds-comparator/odds-comparator.component';
import { BankrollComponent } from './components/bankroll/bankroll.component';
import { LayoutComponent } from './components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'picks', component: PicksTableComponent },
      { path: 'odds', component: OddsComparatorComponent },
      { path: 'bankroll', component: BankrollComponent },
      { path: '**', redirectTo: '' }
    ]
  }
];
