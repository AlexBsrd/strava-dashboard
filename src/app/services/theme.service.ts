import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private theme = new BehaviorSubject<'light' | 'dark'>('light');
  theme$ = this.theme.asObservable();

  constructor() {
    // Récupérer le thème sauvegardé ou utiliser la préférence système
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
  }

  setTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.theme.next(theme);
  }

  toggleTheme() {
    const newTheme = this.theme.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
} 