A single board column: uppercase header with a `[NN]` count and a bordered drop zone holding TaskCards. `over` highlights it during drag; empty shows `// пусто`.

```jsx
<KanbanColumn title="АКТИВНЫЕ" over={isOver}>
  <TaskCard title="…" />
  <TaskCard title="…" />
</KanbanColumn>
```

Column names follow the active theme's vocab (MATRIX: ОЧЕРЕДЬ / АКТИВНЫЕ / БЛОК / ВЫПОЛНЕНО).
