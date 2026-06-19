The core board/list unit. Title row with optional advance button, a category chip, comment count, deadline (amber when `urgent`, red+glow when `overdue`) and a created-relative footer. Hover lifts the neon border.

```jsx
<TaskCard
  title="починить экспорт CSV"
  category="bug"
  deadline="сегодня 18:00"
  deadlineState="urgent"
  comments={2}
  createdLabel="2ч назад"
  onAdvance={() => advance(id)}
/>
```

Presentational — wire your own drag/state. Compose inside `KanbanColumn`.
