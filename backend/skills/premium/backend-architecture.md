## Backend Architecture & API Design

### API Design Principles

- Use RESTful conventions with consistent URL patterns
- Version your API (`/api/v1/resource`)
- Use proper HTTP methods: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)
- Return consistent response envelopes:
  ```typescript
  // Success
  { "data": { ... }, "meta": { "page": 1, "total": 100 } }
  // Error
  { "error": { "code": "VALIDATION_ERROR", "message": "Email is required", "details": [...] } }
  ```

### Error Handling Pattern

```typescript
// Custom error classes for different error types
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

// Global error handler middleware
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details }
    });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
}
```

### Input Validation

- Validate ALL input at the API boundary
- Use Zod for schema validation
- Sanitize inputs to prevent injection attacks
- Return detailed validation errors with field-level messages

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

// Validate and transform
const validated = createUserSchema.parse(req.body);
```

### Security Best Practices

- Rate limit all endpoints (express-rate-limit)
- Set security headers (helmet middleware)
- Use CORS with explicit origin whitelist
- Validate content-type headers
- Implement request size limits
- Sanitize file paths to prevent directory traversal
- Never expose internal error details to clients
- Use parameterized queries for databases (never string concatenation)

### Premium Backend Delights

**Request logging middleware with timing:**
```typescript
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    return originalEnd.apply(this, args);
  };
  next();
});
```

**Async handler wrapper to eliminate try/catch boilerplate:**
```typescript
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage — no try/catch needed in route handlers
app.get('/api/users', asyncHandler(async (req, res) => {
  const users = await userService.list();
  res.json({ data: users });
}));
```

**Health check with dependency status:**
```typescript
app.get('/api/health', async (req, res) => {
  const checks = {
    server: 'ok',
    gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  const healthy = Object.values(checks).every(v => v !== 'error');
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'healthy' : 'degraded', checks });
});
```

### Logging & Monitoring

- Structured logging (JSON format) for production
- Include: timestamp, requestId, method, path, duration, statusCode
- Log errors with full stack traces in development
- Log sanitized error messages in production
- Track request IDs across the request lifecycle

### Code Organization

```
src/
├── middleware/       # Express middleware
├── routes/          # Route definitions
├── controllers/     # Request handlers (thin — orchestrate, don't implement)
├── services/        # Business logic
├── validators/      # Zod schemas
├── errors/          # Error classes
├── types/           # TypeScript types/interfaces
├── utils/           # Pure utility functions
└── config/          # Environment config, constants
```

### TypeScript Configuration

- Enable `strict: true` in tsconfig
- Use `unknown` instead of `any` for type-safe catch blocks
- Prefer interfaces for object shapes, types for unions
- Use `const` assertions for literal types
- Enable `noUnusedLocals` and `noUnusedParameters`
