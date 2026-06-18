## UX Copywriting & Content Strategy

### Writing Principles

Words appear in a design for one reason: to make it easier to understand, and therefore easier to use. Bring the same intentionality to copy that you would bring to spacing and color.

**Write from the user's side of the screen.** Name things by what people control and recognize, never by how the system is built. A person manages notifications, not webhook config.

**Use active voice as default.** A control should say exactly what happens when used: "Save changes," not "Submit." An action keeps the same name through the whole flow — the button that says "Publish" produces a toast that says "Published."

### Interface Vocabulary

- **Buttons:** Use verbs ("Create account," "Send message," "Download report")
- **Links:** Describe the destination ("View pricing," "Read documentation")
- **Errors:** Explain what went wrong AND how to fix it
  - ❌ "Error occurred"
  - ✅ "Invalid email format. Please enter a valid email address."
- **Empty states:** Invitation to act, not a dead end
  - ❌ "No items"
  - ✅ "You haven't added any projects yet. Create your first project."
- **Confirmations:** Be specific about what happened
  - ✅ "Project 'Q4 Report' has been published."
- **Placeholders:** Show examples, not labels
  - ❌ "Enter your email"
  - ✅ "you@company.com"

### Tone & Voice Guidelines

- Keep the register conversational and tuned to the audience
- Use plain verbs, sentence case (not Title Case), no filler
- Match tone to the brand:
  - **Professional:** Formal, precise, authoritative
  - **Friendly:** Warm, approachable, conversational
  - **Playful:** Witty, creative, unexpected
- Be specific over clever — clarity always wins

### Page Content Structure

- **Headlines:** Clear value proposition in 8 words or fewer
- **Subheadlines:** Expand on the headline, add detail, 15-20 words
- **Body copy:** Short paragraphs (2-3 sentences max), scannable
- **Call-to-action:** Single action per section, unambiguous verb
- **Social proof:** Numbers ("10,000+ users"), names, testimonials
- **Features:** Benefit-driven, not feature-driven ("Save hours" not "Has autosave")

### Premium Copywriting Delights

**Testimonial component with real impact:**
```jsx
function Testimonial({ quote, name, role, company, avatar }) {
  return (
    <blockquote className="testimonial">
      <div className="testimonial-stars" aria-label="5 out of 5 stars">
        {'★'.repeat(5)}{'☆'.repeat(0)}
      </div>
      <p className="testimonial-quote">"{quote}"</p>
      <footer className="testimonial-author">
        <img src={avatar} alt="" className="testimonial-avatar" />
        <div>
          <cite className="testimonial-name">{name}</cite>
          <span className="testimonial-role">{role}, {company}</span>
        </div>
      </footer>
    </blockquote>
  );
}
```

**Pricing card with persuasive copy:**
```jsx
function PricingCard({ name, price, description, features, cta, highlighted }) {
  return (
    <div className={`pricing-card ${highlighted ? 'highlighted' : ''}`}>
      <h3 className="pricing-name">{name}</h3>
      <div className="pricing-price">
        <span className="price-amount">${price}</span>
        <span className="price-period">/month</span>
      </div>
      <p className="pricing-description">{description}</p>
      <ul className="pricing-features">
        {features.map((f, i) => (
          <li key={i} className={f.included ? 'included' : 'excluded'}>
            {f.included ? '✓' : '—'} {f.text}
          </li>
        ))}
      </ul>
      <button className={`btn ${highlighted ? 'btn-primary' : 'btn-secondary'}`}>
        {cta}
      </button>
      {highlighted && <p className="pricing-tag">Most popular</p>}
    </div>
  );
}
```

### Marketing Content Patterns

- **Hero section:** Headline + subheadline + CTA + supporting visual
- **Features section:** 3-column grid with icon + title + description
- **Testimonials:** Quote + name + title + company logo
- **Pricing:** 3 tiers, feature comparison, CTA per tier
- **FAQ:** Accordion pattern, question as heading, 2-4 sentence answer
- **Footer:** Links, social, newsletter signup, copyright

### Common Copy Patterns to Avoid

- "Revolutionary" / "Game-changing" / "Next-gen" (meaningless hype)
- "Leverage" / "Utilize" / "Holistic" (corporate jargon)
- "Seamlessly" / "Robustly" (adverbs that add nothing)
- "In today's fast-paced world" / "In an era of" (filler openers)
- Multiple exclamation points or ALL CAPS for emphasis
