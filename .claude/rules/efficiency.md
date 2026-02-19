To minimize token usage:

- For positional tweaks (image position, spacing, sizing), make the edit directly without re-reading the file — use the class values from context or the system reminder diffs.
- When adjusting `object-position`, use large increments (20-25%) to make changes visible. Small 5-10% shifts are often imperceptible.
- Don't re-read the full index.html for small changes. Use the page-structure rule to identify the relevant line range and read only that section.
- Don't screenshot after every minor tweak unless the user asks. Let them preview in browser.
- For color/font/spacing changes, edit the Tailwind config block (lines 8–55) directly.
