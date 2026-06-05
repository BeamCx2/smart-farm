 Smart Farm UI/UX System
Professional UI components and styling guidelines for consistent design across all pages.

## Button Variants

### Primary Button
Used for main CTAs (Call To Actions) - Submit, Login, Purchase, etc.
```jsx
<button className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95">
  Action
</button>
```

### Secondary Button
For alternative actions or neutral functions
```jsx
<button className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold rounded-xl border border-gray-300 dark:border-gray-600 transition-all hover:-translate-y-0.5 active:scale-95">
  Secondary
</button>
```

### Outline Button
For tertiary actions or links
```jsx
<button className="px-6 py-3 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl font-semibold transition-all hover:-translate-y-0.5 active:scale-95">
  Outline
</button>
```

### Danger Button
For destructive actions - Delete, Remove, Cancel
```jsx
<button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95">
  Delete
</button>
```

## Input Fields

### Standard Input
```jsx
<input 
  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-500"
  placeholder="Enter text..."
/>
```

## Cards & Containers

### Standard Card
```jsx
<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow p-6">
  Content
</div>
```

## Badges

```jsx
<span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold">
  Badge
</span>
```

## Typography

- **Headings**: Use `font-black` or `font-bold`
- **Body**: Use `font-semibold` or `font-medium`
- **Small**: Use `text-xs` or `text-sm`
- **Uppercase**: Use `uppercase` + `tracking-wider` for professional look

## Color Palette

**Primary**: Emerald (#059669) - actions, focus
**Secondary**: Gray - backgrounds, text
**Success**: Emerald (#10b981)
**Error**: Red (#dc2626)
**Warning**: Amber (#d97706)
**Info**: Blue (#2563eb)

## Spacing

- Padding: `p-4` (16px), `p-6` (24px)
- Gap: `gap-2` (8px), `gap-3` (12px)
- Margin: `mb-4`, `mt-6`

## Border Radius

- Small: `rounded-lg` (8px)
- Medium: `rounded-xl` (12px)
- Large: `rounded-2xl` (16px)
- Full: `rounded-full`

## Transitions & Animations

- Hover effects: `hover:-translate-y-1` (lift effect)
- Active states: `active:scale-95` (press effect)
- Focus rings: `focus:ring-2 focus:ring-emerald-500`
- Dark mode support: Always include `dark:` variants

## Components to Use

1. **Button.jsx** - Reusable button component
2. **Input.jsx** - Reusable input component
3. **Card.jsx** - Card container component
4. **Badge.jsx** - Status/label badges
5. **PageTabs.jsx** - Tab navigation

## Best Practices

1. ✅ Always use professional button styles, never plain `<button>` tags
2. ✅ Include dark mode support with `dark:` prefix
3. ✅ Use consistent spacing and border radius
4. ✅ Add hover and active states for better UX
5. ✅ Use emojis sparingly and consistently
6. ✅ Maintain consistent typography hierarchy
7. ✅ Include focus rings for accessibility
8. ✅ Use shadows for depth and elevation

## Examples Used

- **Login/Register**: Professional glass-morphism design with gradients
- **Navbar**: Bordered buttons with hover states
- **Orders**: Card-based layout with status badges
- **Products**: Grid with hover effects
- **Admin**: Professional dashboard styling
