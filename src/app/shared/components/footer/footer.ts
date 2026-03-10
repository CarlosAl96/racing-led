import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly currentYear = new Date().getFullYear();
  protected readonly isExpanded = signal(false);
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  protected toggleDetails(): void {
    this.isExpanded.set(true);
  }

  protected openDetails(): void {
    this.isExpanded.set(true);
  }

  protected closeDetails(): void {
    this.isExpanded.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isExpanded() || !this.isMobileViewport()) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.hostElement.nativeElement.contains(target)) {
      this.closeDetails();
    }
  }

  private isMobileViewport(): boolean {
    return window.matchMedia('(max-width: 767px)').matches;
  }
}
