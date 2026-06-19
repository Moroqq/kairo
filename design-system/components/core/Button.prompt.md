Terminal command button — flat surface, translucent-accent border, neon glow on hover/focus. Use `primary` for the single key action on a view; `danger` for destructive actions.

```jsx
<Button variant="primary" icon={<Plus size={12} />}>новая задача</Button>
<Button>отмена</Button>
<Button variant="danger" size="sm">удалить</Button>
<Button loading>сохранение</Button>
```

Variants: `primary` (glowing accent), `secondary` (default, bordered), `ghost` (borderless), `danger` (red). Sizes: `sm` / `md` / `lg`. Pass lucide icons via `icon`. Labels are lowercase Russian by convention.
