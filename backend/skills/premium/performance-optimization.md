## Performance Optimization

### Core Web Vitals

**LCP (Largest Contentful Paint) — Target: < 2.5s**
- Optimize images: serve WebP, compress, use responsive sizes
- Preload hero images and critical fonts
- Minimize render-blocking resources
- Use a CDN for static assets
- Implement server-side rendering or static generation for above-fold content

**INP (Interaction to Next Paint) — Target: < 200ms**
- Defer non-critical JavaScript
- Use `requestIdleCallback` for non-critical work
- Batch DOM reads/writes
- Avoid long tasks (>50ms) on the main thread
- Code-split large JavaScript bundles

**CLS (Cumulative Layout Shift) — Target: < 0.1**
- Set explicit dimensions on all images and embeds
- Reserve space for dynamic content (ads, embeds, banners)
- Use `aspect-ratio` CSS property for media containers
- Avoid inserting content above existing content after load
- Use `transform` animations instead of layout-triggering properties

### Resource Loading Strategy

```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high">

<!-- Preconnect to third-party origins -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://analytics.example.com">

<!-- Defer non-critical CSS/JS -->
<link rel="preload" href="/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<script defer src="/analytics.js"></script>
```

### Premium Performance Delights

**Bundle analysis setup:**
```bash
# Add bundle analysis to your build
npm install --save-dev vite-plugin-visualizer

# In vite.config.ts:
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [visualizer({ open: true })]
```

**Lazy load heavy components with preload hint:**
```tsx
import { lazy, Suspense } from 'react';

const HeavyDashboard = lazy(() => import('./HeavyDashboard'));

// Preload on hover for instant feel
function DashboardButton() {
  const preload = () => {
    const mod = import('./HeavyDashboard'); // Just triggers the load
  };
  return (
    <button onMouseEnter={preload} onFocus={preload}>
      Open Dashboard
    </button>
  );
}
```

**Image optimization component with blur-up placeholder:**
```tsx
function OptimizedImage({ src, alt, width, height, ...props }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="image-wrapper" style={{ aspectRatio: width/height }}>
      {/* Tiny blurred placeholder */}
      <div className={`placeholder ${loaded ? 'hidden' : ''}`} />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={loaded ? 'loaded' : ''}
        {...props}
      />
    </div>
  );
}
```

### JavaScript Optimization

- **Code splitting:** Split bundles by route or component
- **Tree shaking:** Import only what you use
- **Minimize third-party:** Audit and remove unused dependencies
- **Avoid layout thrashing:** Batch DOM reads then writes
- **Use passive event listeners** for scroll/touch events
- **Debounce/throttle** expensive event handlers (resize, scroll, input)

### Image Optimization

- Serve modern formats: WebP (lossy), AVIF (lossy)
- Responsive images with `srcset` and `sizes`
- Lazy load below-fold images with `loading="lazy"`
- Use `decoding="async"` for off-thread decode
- Set explicit `width` and `height` to prevent CLS
- Use blur-up or low-quality placeholder (LQIP) techniques

### Caching Strategy

- Set `Cache-Control` headers for static assets (immutable, long max-age)
- Use ETag for conditional requests
- Implement service worker for offline support and asset caching
- Cache API responses where appropriate (SWR pattern)
- Use Content Delivery Network (CDN) for global distribution

### Build Optimization

- Enable code minification in production builds
- Use content hashing in filenames for cache busting
- Enable gzip or Brotli compression
- Analyze bundle size regularly (vite-plugin-visualizer, webpack-bundle-analyzer)
- Set up performance budgets in CI
