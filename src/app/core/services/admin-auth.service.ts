import { Injectable, computed, signal } from '@angular/core';
import { createClient, type User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

interface SignInResult {
  ok: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private readonly supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL;
  private readonly supabaseAnonKey = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  private readonly supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
  private readonly currentUser = signal<User | null>(null);
  private readonly isSessionChecked = signal(false);

  readonly adminUser = computed(() => this.currentUser());
  readonly isAdminAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
      this.isSessionChecked.set(true);
    });
  }

  async signInWithEmailPassword(email: string, password: string): Promise<SignInResult> {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      return {
        ok: false,
        message: 'No se encontro la configuracion de Supabase para iniciar sesion.',
      };
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        ok: false,
        message: this.mapSupabaseError(error.message),
      };
    }

    this.currentUser.set(data.user ?? null);
    this.isSessionChecked.set(true);

    return { ok: true };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
    this.isSessionChecked.set(true);
  }

  async hasValidAdminSession(): Promise<boolean> {
    if (this.isSessionChecked()) {
      return this.isAdminAuthenticated();
    }

    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      this.currentUser.set(null);
      this.isSessionChecked.set(true);
      return false;
    }

    if (!data.session?.user) {
      this.currentUser.set(null);
      this.isSessionChecked.set(true);
      return false;
    }

    this.currentUser.set(data.session.user);
    this.isSessionChecked.set(true);

    return true;
  }

  private mapSupabaseError(message: string): string {
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes('invalid login credentials')) {
      return 'Correo o contrasena incorrectos.';
    }

    if (normalizedMessage.includes('email not confirmed')) {
      return 'Debes confirmar tu correo antes de iniciar sesion.';
    }

    return 'No se pudo iniciar sesion. Intentalo nuevamente.';
  }
}
