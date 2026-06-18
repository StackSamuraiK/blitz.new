## React Performance & Best Practices

### Eliminating Waterfalls (CRITICAL)

- **Parallel data fetching:** Use `Promise.all()` for independent operations
- **Defer awaits:** Move `await` into branches where actually used
- **Cheap conditions first:** Check cheap sync conditions before awaiting
- **Start early:** Start promises early, `await` late
- **Suspense boundaries:** Use React.Suspense to stream content progressively

### Bundle Size Optimization (CRITICAL)

- Import directly from module paths, avoid barrel files (index.ts re-exports)
- Use dynamic imports (`React.lazy` or `next/dynamic`) for heavy components
- Defer third-party analytics/logging scripts until after hydration
- Preload critical assets on hover/focus for perceived speed
- Use `React.memo` only for components with expensive renders

### Render Performance

```tsx
// Extract static JSX outside component
const STATIC_HEADER = <h1 className="text-2xl font-bold">App Title</h1>;

function App() {
  return (
    <div>
      {STATIC_HEADER}
      <DynamicContent />
    </div>
  );
}
```

- **Memoize expensive computations:** `useMemo` for derived data, `useCallback` for stable callbacks
- **Lazy state initialization:** Pass function to `useState` for expensive initial values:
  ```tsx
  const [data, setData] = useState(() => expensiveComputation());
  ```
- **Use functional setState:** For stable callbacks that depend on previous state
- **Split combined hooks:** Separate hooks with independent dependencies
- **Don't define components inside components:** Creates re-mount on every render
- **Use startTransition:** For non-urgent state updates

### State Management

- Keep state as local as possible
- Derive state during render, not in effects
- Subscribe to derived booleans, not raw values
- Use refs for transient values that don't need re-renders
- Avoid module-level mutable state in server components

### Effect Patterns

- Clean up all effects (subscriptions, event listeners, timers)
- Use refs for values needed in cleanup but not as dependencies
- Don't put `useEffectEvent` results in effect dependency arrays
- Store event handlers in refs for stable references

### Premium React Delights

**Custom hook for data fetching with all states:**
```tsx
function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));
    fn()
      .then(data => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch(error => { if (!cancelled) setState({ data: null, loading: false, error }); });
    return () => { cancelled = true; };
  }, deps);

  return state;
}
```

**Optimistic updates for instant UI feedback:**
```tsx
function useOptimistic<T>(initial: T) {
  const [optimistic, setOptimistic] = useState(initial);
  const [serverState, setServerState] = useState(initial);

  const update = useCallback(async (newValue: T, commit: () => Promise<T>) => {
    setOptimistic(newValue); // Show immediately
    try {
      const result = await commit();
      setServerState(result);
      setOptimistic(result);
    } catch {
      setOptimistic(serverState); // Revert on error
    }
  }, [serverState]);

  return { value: optimistic, update };
}
```

### Styling Approach

- Use Tailwind CSS utility classes for consistent spacing and colors
- Extract repeated utility combinations into components
- Use CSS modules or CSS-in-JS sparingly
- Prefer CSS custom properties for theme values
