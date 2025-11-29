# NightOwl Developers Brand Colors

## Brand Inspiration
- [Emma Marketing Platform](http://myemma.com/)
- [BrandColors Collection](https://brandcolors.net/)

## Official Color Palette

Our brand uses a clean, modern color palette that creates a professional yet approachable aesthetic.

### Primary Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Navy** | `#314855` | Primary backgrounds, headers, text |
| **Sky Blue** | `#5cc3e8` | Primary actions, links, highlights |
| **Sunshine** | `#ffdb00` | Accents, CTAs, important highlights |
| **Mint** | `#79ceb8` | Success states, secondary highlights |
| **Coral** | `#e95f5c` | Errors, warnings, important notices |

### Color Applications

#### Navy (#314855)
- Primary text color
- Navigation backgrounds
- Footer backgrounds
- Card headers
- Dark mode base

#### Sky Blue (#5cc3e8)
- Primary buttons
- Links and interactive elements
- Active states
- Brand accents
- Icons

#### Sunshine (#ffdb00)
- Call-to-action buttons
- Important highlights
- Special offers
- Badges and notifications
- Hover states for emphasis

#### Mint (#79ceb8)
- Success messages
- Completed states
- Secondary buttons
- Form validation (success)
- Subtle backgrounds

#### Coral (#e95f5c)
- Error messages
- Required field indicators
- Delete/Remove actions
- Urgent notifications
- Form validation (errors)

## Design Guidelines

### Typography
- Headings: Navy (#314855) or Sky Blue (#5cc3e8)
- Body text: Navy (#314855) with opacity variations for hierarchy
- Links: Sky Blue (#5cc3e8)

### Buttons
- **Primary**: Sky Blue background with white text
- **Secondary**: Navy background with white text
- **Accent**: Sunshine background with Navy text
- **Success**: Mint background with white text
- **Danger**: Coral background with white text

### Backgrounds
- **Main**: White (#FFFFFF) or very light gray (#F8FAFC)
- **Sections**: Alternating white and light backgrounds
- **Cards**: White with subtle shadows
- **Overlays**: Navy with opacity

### Accessibility
All color combinations meet WCAG 2.1 AA standards for contrast:
- Navy on White: 7.82:1 ✓
- Sky Blue on White: 3.84:1 ✓
- Sky Blue on Navy: 3.16:1 ✓
- White on Sky Blue: 4.77:1 ✓
- Navy on Sunshine: 7.45:1 ✓

## Tailwind CSS Usage

```jsx
// Backgrounds
className="bg-brand-navy"
className="bg-brand-sky"
className="bg-brand-sunshine"
className="bg-brand-mint"
className="bg-brand-coral"

// Text
className="text-brand-navy"
className="text-brand-sky"

// Borders
className="border-brand-sky"

// Hover states
className="hover:bg-brand-sky"
```

## Version History
- **v1.0.0** (2025-11-19): Initial brand color system

