import { Injectable, computed, signal } from '@angular/core';
import { AuthSession } from '../../../shared/models/auth.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentSessionSignal = signal<AuthSession | null>(null);

  session = this.currentSessionSignal.asReadonly();

  userInitials = computed(() => {
    const session = this.currentSessionSignal();
    if (!session || !session.user) return null;
    
    // Attempt to extract initials
    const name = session.user.name || '';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1) {
      return (parts[0].substring(0, 2)).toUpperCase();
    }
    return '';
  });

  isLoggedIn = computed(() => {
    return this.currentSessionSignal() !== null;
  });

  constructor() {
    this.loadSession();
  }

  setSession(session: AuthSession | null) {
    this.currentSessionSignal.set(session);
    if (session) {
      localStorage.setItem('authSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('authSession');
    }
  }

  loadSession() {
    const saved = localStorage.getItem('authSession');
    if (saved) {
      try {
        this.currentSessionSignal.set(JSON.parse(saved));
      } catch (e) {
        this.currentSessionSignal.set(null);
      }
    }
  }

  logout() {
    this.setSession(null);
  }
}
