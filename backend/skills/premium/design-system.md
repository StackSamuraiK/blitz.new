## Design System Component Architecture

### Design Token System

```css
:root {
  /* Colors */
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-primary-light: #93C5FD;
  --color-secondary: #8B5CF6;
  --color-accent: #F59E0B;
  --color-neutral-50: #F9FAFB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-200: #E5E7EB;
  --color-neutral-300: #D1D5DB;
  --color-neutral-400: #9CA3AF;
  --color-neutral-500: #6B7280;
  --color-neutral-600: #4B5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1F2937;
  --color-neutral-900: #111827;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Typography Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;

  /* Spacing Scale (4px base) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-modal: 0 25px 50px -12px rgb(0 0 0 / 0.25);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

### Dark Mode

```css
/* Use prefers-color-scheme or data-attribute toggle */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #60A5FA;
    --color-neutral-50: #111827;
    --color-neutral-100: #1F2937;
    --color-neutral-200: #374151;
    --color-surface: #1F2937;
    --color-text: #F9FAFB;
  }
}
```

### Component Design Principles

- **Buttons:** 3 variants (primary, secondary, ghost), 3 sizes (sm, md, lg), loading state, disabled state
- **Inputs:** Consistent padding, border, focus ring, error state, helper text, label positioning
- **Cards:** Consistent padding, border-radius, shadow on hover, optional header/footer
- **Navigation:** Responsive (hamburger on mobile), active state, dropdown support, breadcrumbs
- **Modals:** Centered, backdrop overlay, close button, focus trap, escape to close
- **Tables:** Responsive (horizontal scroll on mobile), striped rows, sortable headers
- **Forms:** Label-input association, validation states, error messages, required indicators

### Premium Component Delights

**Toast notification with progress bar:**
```jsx
function Toast({ message, type = 'success', duration = 4000, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className={`toast toast-${type}`} role="alert">
      <span>{message}</span>
      <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />
      <button onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}
```

**Empty state with illustration and CTA:**
```jsx
function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionLabel && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
```

### Accessibility Standards

- All interactive elements must be keyboard-focusable
- Visible focus indicators (not just :focus-visible removal)
- ARIA labels where semantic HTML is insufficient
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Form inputs associated with labels via `for` attribute
- Error messages linked to inputs via `aria-describedby`
