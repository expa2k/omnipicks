import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:8000/api';

  /** Se emite cuando el usuario pulsa "Actualizar" en la barra superior. */
  readonly refresh$ = new Subject<void>();

  /** Día que está mostrando la cartelera (hora del Este): hoy o el siguiente día con partidos. */
  readonly slate = signal<{ date: string; isToday: boolean } | null>(null);

  constructor(private http: HttpClient) {}

  refresh() {
    this.refresh$.next();
  }

  getDashboardSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/predictions/dashboard`);
  }

  getPicks(sport?: string): Observable<any> {
    const url = sport ? `${this.baseUrl}/predictions/picks?sport=${sport}` : `${this.baseUrl}/predictions/picks`;
    return this.http.get(url);
  }

  getNbaPerformance(): Observable<any> {
    return this.getPerformance('nba');
  }

  /** Rendimiento en vivo del modelo de un deporte (nba o nfl). */
  getPerformance(sport: 'nba' | 'nfl'): Observable<any> {
    return this.http.get(`${this.baseUrl}/predictions/${sport}/performance`);
  }

  getGamePredictions(sport?: string, includeFinished = false): Observable<any> {
    const params: Record<string, string> = {};
    if (sport) params['sport'] = sport;
    if (includeFinished) params['include_finished'] = 'true';
    return this.http.get(`${this.baseUrl}/predictions/games`, { params }).pipe(
      tap((d: any) => { if (!includeFinished && d?.date) this.slate.set({ date: d.date, isToday: d.is_today !== false }); }),
    );
  }
}
