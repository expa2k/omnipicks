import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:8000/api';

  /** Se emite cuando el usuario pulsa "Actualizar" en la barra superior. */
  readonly refresh$ = new Subject<void>();

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

  getGamePredictions(sport?: string): Observable<any> {
    const url = sport
      ? `${this.baseUrl}/predictions/games?sport=${sport}`
      : `${this.baseUrl}/predictions/games`;
    return this.http.get(url);
  }
}
