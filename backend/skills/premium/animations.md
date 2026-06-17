## Animation & Motion Design

Leverage motion deliberately to enhance user experience. Think about where and if animation can serve the subject: page-load sequences, scroll-triggered reveals, hover micro-interactions, ambient atmosphere.

### Motion Principles

- An orchestrated moment lands harder than scattered effects
- Sometimes less is more — extra animation can make a design feel AI-generated
- Choose what the direction calls for rather than applying animations everywhere
- Respect `prefers-reduced-motion` for accessibility

### Interactive Animations

- Add subtle hover effects on buttons, cards, and links
  - Scale transform (1.02-1.05) on hover
  - Shadow elevation increase on hover
  - Color transitions (200-300ms)
  - Underline reveal for text links

- Page/section entrance animations
  - Fade-in + slide-up on scroll into viewport
  - Use Intersection Observer for trigger
  - Stagger children for lists and grids
  - Initial opacity of 0, transform translateY(20px)

- Micro-interactions
  - Button press: scale(0.97) on active
  - Toast/snackbar: slide-in from top or bottom
  - Modal: fade-in backdrop + scale-up content
  - Dropdown: opacity + translateY for menu panel

### Animation Performance

```css
/* Performance-optimized animation properties */
/* Always prefer transform and opacity (GPU-accelerated) */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Premium Animation Delights

**Counter animation for numbers:**
```css
/* Animate number counting up on scroll-in */
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.stat-number {
  display: inline-block;
  animation: countUp 0.6s ease both;
}
```

**Smooth page transitions (SPA feel):**
```jsx
// Wrap route transitions with AnimatePresence
function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}
```

**Scroll-triggered reveal with IntersectionObserver:**
```jsx
function RevealOnScroll({ children }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${isVisible ? 'visible' : ''}`}>
      {children}
    </div>
  );
}
```

### Timing Guidelines

- Micro-interactions: 150-300ms for snappy feel
- Page transitions: 300-500ms
- Entrance animations: 400-800ms
- Complex reveals: 800-1200ms (with stagger)
- Use cubic-bezier easing for natural motion
  - Standard: cubic-bezier(0.4, 0, 0.2, 1)
  - Decelerate: cubic-bezier(0, 0, 0.2, 1)
  - Accelerate: cubic-bezier(0.4, 0, 1, 1)

### Loading States

- Skeleton screens (not spinners) for content loading
- Pulse animation for skeleton elements
- Progress bars for multi-step operations
- Transition from skeleton to content smoothly (opacity fade)
