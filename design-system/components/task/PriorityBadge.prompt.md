Priority indicators. `PriorityBadge` is a letter pill (A critical → D low); `PriorityStripe` is a glowing left edge for cards (parent must be `position: relative`).

```jsx
<PriorityBadge priority="A" />
<PriorityBadge priority="C" showLabel={false} />
<div style={{ position: 'relative' }}><PriorityStripe priority="B" /> … </div>
```
