## Accessibility (a11y) Standards

### Semantic HTML (Foundation)

- Use semantic HTML elements by default: `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`
- Use heading elements (`h1`-`h6`) in hierarchical order
- Use `<button>` for actions, `<a>` for navigation (never use `<div>` as button)
- Use `<label>` for form inputs, associated via `for` attribute
- Use `<table>` with `<caption>`, `<th>`, and `<thead>` for tabular data
- Use `<fieldset>` and `<legend>` for form groups

### ARIA Usage

```html
<!-- Use ARIA only when semantic HTML is insufficient -->
<nav aria-label="Main navigation">...</nav>
<button aria-expanded="false" aria-controls="menu">Menu</button>
<div role="alert" aria-live="polite">Item saved successfully</div>
<div aria-describedby="error-email">Email field</div>
<span id="error-email" role="alert">Please enter a valid email</span>
```

**ARIA Rules:**
- Don't override default semantics (no `role="button"` on `<button>`)
- Ensure all interactive elements have accessible names
- Use `aria-live="polite"` for dynamic content updates
- Use `aria-atomic="true"` for complete region updates
- Manage focus for modals, dialogs, and single-page transitions

### Keyboard Accessibility

- All interactive elements must be reachable via Tab key
- Visible focus indicator (minimum 2px solid outline, 3:1 contrast ratio)
- Logical tab order (matches visual order)
- No keyboard traps (focus must leave custom widgets)
- Implement arrow key navigation for lists/tabs/toolbars
- Escape key closes modals, dropdowns, and menus
- Enter/Space activates focused elements

### Premium Accessibility Delights

**Focus-visible for mouse users (no focus ring on click, only on keyboard):**
```css
/* Show focus ring only for keyboard users */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
/* Remove focus ring for mouse users (they see other hover states) */
:focus:not(:focus-visible) {
  outline: none;
}
```

**Skiplink for keyboard navigation:**
```html
<!-- First focusable element on the page -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 1rem;
  background: var(--color-primary);
  color: white;
  padding: 0.5rem 1rem;
  z-index: 1000;
}
.skip-link:focus {
  top: 1rem; /* Slides into view on focus */
}
</style>
```

**Announce dynamic changes to screen readers:**
```tsx
function LiveRegion({ children, announce = 'polite' }) {
  return (
    <div
      role="status"
      aria-live={announce}
      aria-atomic="true"
      className="sr-only"  // Visually hidden but accessible
    >
      {children}
    </div>
  );
}

// Usage: announce successful actions
function SaveButton() {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <button onClick={async () => {
        await save();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }}>
        Save Changes
      </button>
      {saved && <LiveRegion>Document saved successfully</LiveRegion>}
    </>
  );
}
```

### Color & Contrast

- **Normal text (< 18px or < 14px bold):** Minimum 4.5:1 contrast ratio
- **Large text (≥ 18px or ≥ 14px bold):** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast for borders and focus indicators
- **Do not rely solely on color** to convey information (use icons + text + patterns)
- Test with color blindness simulators (Deuteranopia, Protanopia, Tritanopia)

### Focus Management

```tsx
// Focus trap for modals
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the first focusable element
      modalRef.current.querySelector<HTMLElement>('button, [href], input')?.focus();
    }
  }, [isOpen]);

  // Return focus to trigger element on close
  useEffect(() => {
    if (!isOpen) {
      document.activeElement?.focus();
    }
  }, [isOpen]);
  // ...
}
```

### Screen Reader Support

- Images: Always provide `alt` text (decorative images use `alt=""`)
- Icons: Use `aria-hidden="true"` + visible text or `aria-label`
- Complex images: Provide long description or adjacent text
- Links: Descriptive text (not "click here")
- Forms: All inputs have associated labels
- Tables: Caption summaries for complex tables
- Dynamic content: Announce changes with `aria-live` regions

### Testing Checklist

- Navigate entire page using Tab key only
- Navigate entire page using screen reader (VoiceOver, NVDA, JAWS)
- Test with browser zoom at 200%
- Test with default font size increased to 200%
- Test without CSS (does the linear order make sense?)
- Verify no keyboard traps
- Check color contrast with automated tools (axe, Lighthouse)
- Verify reduced motion respected (`prefers-reduced-motion`)
