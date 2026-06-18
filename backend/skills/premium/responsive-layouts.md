## Responsive Layout Architecture

Use a mobile-first approach with a systematic breakpoint strategy.

### Breakpoint System

```
sm:   640px   — Mobile landscape
md:   768px   — Tablet portrait
lg:   1024px  — Tablet landscape / small desktop
xl:   1280px  — Desktop
2xl:  1536px  — Large desktop
```

### Mobile-First Principles

- Design for small screens first, enhance for larger
- Use `min-width` media queries exclusively (no `max-width`)
- Ensure touch targets are at least 44x44px on mobile
- Test all layouts at 320px, 768px, and 1440px widths

### Layout Patterns

- **Page layout:** Use CSS Grid for overall page structure
- **Component layout:** Use Flexbox for component-level arrangement
- **Content width:** Constrain to max 1200px for readability
- **Side margins:** Use `padding: 1rem` on mobile, scale up at each breakpoint
- **Navigation:** Use hamburger menu on mobile, horizontal nav at lg+

### Fluid Typography

```css
/* Use clamp() for fluid type scaling */
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
--text-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
--text-3xl: clamp(2rem, 1.7rem + 1.5vw, 3rem);
```

### Responsive Images

- Use `srcset` and `sizes` attributes for responsive images
- Serve WebP format with JPEG/PNG fallback
- Implement lazy loading with `loading="lazy"`
- Use `object-fit` for consistent image aspect ratios

### Premium Layout Delights

**Smooth navigation transitions:**
```css
/* Mobile nav slide-in */
.mobile-nav {
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.mobile-nav.open {
  transform: translateX(0);
}
/* Backdrop blur for overlay */
.nav-backdrop {
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.nav-backdrop.open {
  opacity: 1;
}
```

**Auto-grid layout (adjusts columns automatically):**
```css
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 1.5rem;
}
```

**Responsive typography with container queries (modern):**
```css
/* Card adjusts its internal layout based on container width */
.card {
  container-type: inline-size;
}
@container (max-width: 400px) {
  .card-layout {
    flex-direction: column;
  }
}
```

### Testing Requirements

- Test on actual mobile device (not just browser resize)
- Verify no horizontal scroll at any viewport width
- Check that all interactive elements are accessible via touch
- Ensure text does not overflow containers at any size
- Test with browser zoom at 200% — layout should still be usable
