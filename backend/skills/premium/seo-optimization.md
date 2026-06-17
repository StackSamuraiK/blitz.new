## SEO & Semantic HTML Optimization

### Meta Tags

```html
<!-- Required meta tags for every page -->
<title>Primary Keyword - Brand Name (50-60 chars)</title>
<meta name="description" content="Compelling 150-160 char description with keyword">
<meta property="og:title" content="Same as title tag">
<meta property="og:description" content="Same as meta description">
<meta property="og:image" content="https://example.com/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">
<meta property="og:url" content="https://example.com/page">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Same as title">
<meta name="twitter:description" content="Same as description">
```

### Semantic HTML Structure

```html
<!-- Correct document structure -->
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main role="main">
  <h1>Primary page heading</h1>
  <section aria-labelledby="section1-heading">
    <h2 id="section1-heading">Section heading</h2>
    <article>
      <h3>Article heading</h3>
    </article>
  </section>
</main>

<footer role="contentinfo">
  <p>&copy; 2026 Company Name</p>
</footer>
```

### Heading Hierarchy Rules

- ONE `<h1>` per page (matches the page's primary topic)
- Proper nesting: h1 → h2 → h3 (never skip levels)
- h1 contains the primary keyword
- Headings describe the content that follows

### Structured Data (JSON-LD)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "sameAs": [
    "https://twitter.com/company",
    "https://linkedin.com/company/company"
  ]
}
</script>
```

### Premium SEO Delights

**Breadcrumb structured data for navigation:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://example.com/products" },
    { "@type": "ListItem", "position": 3, "name": "Widget", "item": "https://example.com/products/widget" }
  ]
}
</script>
```

**FAQ structured data for content sections:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is your return policy?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "We offer 30-day returns on all products."
    }
  }]
}
</script>
```

**Image SEO best practices:**
```html
<!-- Properly optimized responsive image -->
<img
  src="photo-800.webp"
  srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1200.webp 1200w"
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Product demonstration showing the widget in use"
  loading="lazy"
  decoding="async"
  width="800"
  height="600"
>
```

### Technical SEO Requirements

- Canonical URL on every page (self-referencing)
- Proper heading hierarchy (h1 → h2 → h3, no skipping)
- Alt text on ALL images (descriptive, not keyword-stuffed)
- Descriptive, keyword-rich URLs (lowercase, hyphen-separated)
- Proper internal linking structure (3-click depth max)
- Sitemap.xml with all pages
- Robots.txt not blocking important resources

### Core Web Vitals Targets

- LCP (Largest Contentful Paint): < 2.5s
- INP (Interaction to Next Paint): < 200ms
- CLS (Cumulative Layout Shift): < 0.1
- TTFB (Time to First Byte): < 800ms
