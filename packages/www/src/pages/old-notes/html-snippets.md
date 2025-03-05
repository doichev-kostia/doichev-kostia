---
layout: "../../layouts/Markdown.astro"
title: HTML snippets 
---

### Card as a link
For a screen reader to say only the important part, use aria attributes `aria-labelledby`
```html
<a href="#" aria-labelledby="card-title">
  <h2 id="card-title">Some title</h2>
  <time>2025-03-05</time>
  <p> some description </p>
</a>
```
