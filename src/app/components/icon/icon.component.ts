import { Component, Input } from '@angular/core';

/** Íconos de trazo (estilo Lucide), en línea para que hereden `currentColor`. */
@Component({
  selector: 'app-icon',
  standalone: true,
  host: { class: 'app-icon', 'aria-hidden': 'true' },
  styles: [`:host { display: inline-flex; width: 18px; height: 18px; flex-shrink: 0; } svg { width: 100%; height: 100%; }`],
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      @switch (name) {
        @case ('dashboard') { <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/> }
        @case ('soccer') { <circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 4.5h-5L8 10z"/><path d="M12 3v4M21 10.5l-5-.5M18 19l-3.5-4.5M6 19l3.5-4.5M3 10.5l5-.5"/> }
        @case ('basketball') { <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/><path d="M5.6 5.6c3.5 3.5 3.5 9.3 0 12.8M18.4 5.6c-3.5 3.5-3.5 9.3 0 12.8"/> }
        @case ('football') { <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)"/><path d="m9 15 6-6M10.5 10.5l1 1M12.5 12.5l1 1M11.5 9.5l1 1M10 12l1 1"/> }
        @case ('baseball') { <circle cx="12" cy="12" r="9"/><path d="M6.2 5.5c2 2.2 2.8 4.4 2.8 6.5s-.8 4.3-2.8 6.5M17.8 5.5c-2 2.2-2.8 4.4-2.8 6.5s.8 4.3 2.8 6.5"/> }
        @case ('scale') { <path d="M12 3v18M7 21h10M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/> }
        @case ('wallet') { <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3"/><path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M21 12h-4a2 2 0 0 0 0 4h4z"/> }
        @case ('sun') { <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/> }
        @case ('moon') { <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/> }
        @case ('refresh') { <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/> }
        @case ('menu') { <path d="M4 6h16M4 12h16M4 18h16"/> }
        @case ('close') { <path d="M18 6 6 18M6 6l12 12"/> }
        @case ('chevron') { <path d="m6 9 6 6 6-6"/> }
        @case ('arrow-right') { <path d="M5 12h14M13 6l6 6-6 6"/> }
        @case ('calendar') { <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/> }
        @case ('target') { <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/> }
        @case ('sparkle') { <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/> }
        @case ('alert') { <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/> }
        @case ('info') { <circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/> }
        @case ('clock') { <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/> }
        @case ('pin') { <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/> }
        @case ('search') { <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/> }
        @case ('chart') { <path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/> }
        @case ('bandage') { <rect x="2" y="8" width="20" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M10 10h.01M14 14h.01M10 14h.01M14 10h.01"/> }
        @default { <circle cx="12" cy="12" r="9"/> }
      }
    </svg>
  `,
})
export class IconComponent {
  @Input() name = '';
}
