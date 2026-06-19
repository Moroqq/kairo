Terminal text fields. `Input` for one line, `Textarea` for many. Both take a `label` (rendered with a `›` chevron) and an `error` string that reddens the border and prints an `[error]` line.

```jsx
<Input label="название" placeholder="что нужно сделать…" />
<Input label="дедлайн" error="неверная дата" defaultValue="32.13" />
<Textarea label="заметки" rows={4} placeholder="контекст…" />
```
