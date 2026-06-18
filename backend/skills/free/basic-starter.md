## Output Requirements
Generate clean, semantic HTML5 and modern CSS that loads fast and works reliably.

- Write valid, semantic HTML5 with proper heading hierarchy (h1-h6) and landmark elements (main, nav, section, article, aside, header, footer).
- Use modern CSS (Flexbox, Grid, custom properties) for layout — avoid float-based layouts and table-based designs unless presenting tabular data.
- Keep the design simple, functional, and accessible. Do not add complex animations, glassmorphism, gradients, or decorative effects.
- Ensure the page is responsive: use a single breakpoint at 768px for tablet/mobile adjustments.
- Use system font stacks (e.g., `system-ui, -apple-system, sans-serif`) — do not import external fonts unless explicitly requested.
- Optimize for performance: minimize CSS, avoid unnecessary wrappers, and keep the DOM tree shallow.
- Include a viewport meta tag and set `box-sizing: border-box` globally.
- Ensure all color combinations meet WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text).
- Use descriptive alt text on all images and icons.
- Do not use JavaScript libraries or frameworks unless the project explicitly requests them.
- Keep file count minimal — prefer a single HTML file with embedded CSS and JS for simple projects, or a clear separation of concerns for multi-page projects.
- Every page must have a `<title>` tag and a meta description.
