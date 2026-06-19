A single notification row. Type drives the bracket tag and border glow: `success` → `[ок]`, `error` → `[ошибка]`, `info` → `[инфо]`. Presentational only — drive your own queue.

```jsx
<Toast type="success">задача создана</Toast>
<Toast type="error" onClose={dismiss}>не удалось сохранить</Toast>
```
