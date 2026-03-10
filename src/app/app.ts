import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('racing-led');
  private readonly document = inject(DOCUMENT);
  private readonly darkModeMediaQuery = this.createDarkModeMediaQuery();
  private readonly colorSchemeHandler = (event: MediaQueryListEvent): void => {
    this.applyDarkMode(event.matches);
  };

  constructor(
    private readonly toastService: ToastService,
    private readonly messageService: MessageService,
  ) {
    this.toastService.getMessage().subscribe((message) => {
      if (message.severity != '') {
        this.messageService.add(message);
      }
    });
  }

  ngOnInit(): void {
    this.applyDarkMode(this.darkModeMediaQuery.matches);
    this.darkModeMediaQuery.addEventListener('change', this.colorSchemeHandler);
  }

  ngOnDestroy(): void {
    this.darkModeMediaQuery.removeEventListener('change', this.colorSchemeHandler);
  }

  private applyDarkMode(isDark: boolean): void {
    this.document.documentElement.classList.toggle('app-dark', isDark);
    this.document.body.classList.toggle('app-dark', isDark);
  }

  private createDarkModeMediaQuery(): MediaQueryList {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)');
    }

    return {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    } as MediaQueryList;
  }
}
