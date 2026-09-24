type P = { className?: string };

export const IconPlay = ({ className = "size-8" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.95-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z" />
  </svg>
);

export const IconStop = ({ className = "size-8" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export const IconHelp = ({ className = "size-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.9" strokeLinecap="round" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </svg>
);

export const IconStats = ({ className = "size-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M5 20V11M12 20V4M19 20v-6" strokeLinecap="round" />
  </svg>
);

export const IconMic = ({ className = "size-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" strokeLinecap="round" />
  </svg>
);

export const IconSpinner = ({ className = "size-8" }: P) => (
  <svg viewBox="0 0 24 24" className={`${className} animate-spin`} fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
