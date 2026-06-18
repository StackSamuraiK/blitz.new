## Modern Design & Visual Identity

Approach design as a distinctive visual identity, not a template. Make deliberate, opinionated choices about palette, typography, and layout that are specific to this project's brief.

### Design Principles

**Ground it in the subject.** If the brief does not pin down what the product is, name the concrete subject, its audience, and the page's single job before designing. The subject's own world — its materials, instruments, artifacts — is where distinctive choices come from.

**The hero is a thesis.** Open with the most characteristic thing in the subject's world: a headline, an animation, a live demo, an interactive moment. Avoid the template answer (big number + small label + gradient accent) unless truly the best option.

**Typography carries personality.** Pair display and body faces deliberately. Set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design.

**Structure is information.** Structural devices (numbering, dividers, labels) should encode something true about the content, not decorate it. Question if numbered markers (01/02/03) make sense — only use if the content is actually a sequence.

### Visual Systems

- Use modern glassmorphism effects (backdrop-blur, semi-transparent backgrounds) 
- Implement gradient color schemes (blue-to-purple, warm gradients, duotone palettes)
- Apply smooth transitions and micro-interactions on all interactive elements
- Use proper spacing hierarchy based on 8px grid system
- Include responsive design for mobile, tablet, and desktop
- Use modern CSS features (grid, flexbox, custom properties)
- Add loading states and skeleton screens for data-heavy components

### Color Palette Guidelines

- Define 4-6 named hex values for the palette
- Include: primary, secondary, accent, neutral, background, and surface colors
- Ensure WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Use CSS custom properties for all colors
- Provide semantic color tokens (success, warning, error, info)

### CSS Architecture

- Use CSS custom properties for theming
- Implement a consistent border-radius hierarchy (sm: 4px, md: 8px, lg: 16px, xl: 24px)
- Define shadow elevation levels (low, medium, high, modal)
- Use consistent iconography style (outline or filled, not mixed)

### Premium Design Delights

**Subtle hover micro-interactions:**
```css
/* Card hover: gentle lift + shadow deepen */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

/* Button: subtle scale on press */
button:active {
  transform: scale(0.97);
}

/* Smooth gradient animation for hero sections */
.hero-gradient {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
}
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

**Loading skeleton with shimmer:**
```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Page transition entrance:**
```css
.page-enter {
  animation: fadeInUp 0.5s ease both;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Stagger children */
.page-enter > *:nth-child(1) { animation-delay: 0ms; }
.page-enter > *:nth-child(2) { animation-delay: 100ms; }
.page-enter > *:nth-child(3) { animation-delay: 200ms; }
```

### Self-Critique Checklist

Before finalizing, review:
1. Does every element serve the brief?
2. Is there one memorable signature element?
3. Does the design read as distinctive or templated?
4. Are responsive breakpoints handled (320px, 768px, 1440px)?
5. Is reduced motion respected via `prefers-reduced-motion`?
6. Are all interactive elements keyboard-focusable?
7. Does the loading experience feel considered (not just a spinner)?
8. Are there micro-interactions that make the UI feel alive?
