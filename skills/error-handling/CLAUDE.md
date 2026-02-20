# Error Handling (reference)

Reference for the error-handling skill: patterns, examples, and best practices for frontend and backend error handling.

## Core Principles

1. **Errors are data** – Treat errors as structured data with codes, context, and metadata
2. **Fail gracefully** – When something breaks, degrade gracefully rather than crashing
3. **Preserve context** – Include enough information to debug without exposing sensitive data
4. **Separate concerns** – User-facing errors vs internal errors; what to show vs what to log
5. **Be specific** – Generic "Something went wrong" helps no one; be actionable

## Custom Error Classes

### Pattern: Extend Error with codes and context

```typescript
// Base application error
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message: string, public field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', 400, { field, value });
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, { resource, id });
  }
}

class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

class AuthorizationError extends AppError {
  constructor(action: string, resource: string) {
    super(
      `Not authorized to ${action} ${resource}`,
      'AUTHORIZATION_ERROR',
      403,
      { action, resource }
    );
  }
}

class ExternalServiceError extends AppError {
  constructor(service: string, originalError: Error) {
    super(
      `External service ${service} failed`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      { service, originalError: originalError.message }
    );
  }
}
```

### Usage

```typescript
// Validate input
if (!email || !email.includes('@')) {
  throw new ValidationError('Invalid email format', 'email', email);
}

// Resource not found
const user = await db.findUser(userId);
if (!user) {
  throw new NotFoundError('User', userId);
}

// Authorization check
if (user.id !== requestingUserId) {
  throw new AuthorizationError('edit', 'user profile');
}

// External service failure
try {
  await stripe.charges.create(...);
} catch (err) {
  throw new ExternalServiceError('Stripe', err as Error);
}
```

## Error Codes

### Naming Convention

Use `SCREAMING_SNAKE_CASE` for error codes. Prefix with category.

**Categories:**
- `VALIDATION_*` – Input validation failures
- `NOT_FOUND` – Resource not found
- `AUTH_*` – Authentication/authorization failures
- `RATE_LIMIT_*` – Rate limiting
- `EXTERNAL_*` – External service failures
- `DATABASE_*` – Database errors
- `NETWORK_*` – Network errors

**Examples:**
```typescript
'VALIDATION_ERROR'
'VALIDATION_EMAIL_INVALID'
'VALIDATION_PASSWORD_TOO_SHORT'
'NOT_FOUND'
'AUTH_TOKEN_EXPIRED'
'AUTH_INVALID_CREDENTIALS'
'RATE_LIMIT_EXCEEDED'
'EXTERNAL_SERVICE_ERROR'
'DATABASE_CONNECTION_FAILED'
```

## User-Facing vs Internal Errors

### Pattern: Separate what users see from what gets logged

```typescript
function toUserError(error: AppError): { message: string; code: string } {
  // Safe messages for users
  const userMessages: Record<string, string> = {
    VALIDATION_ERROR: error.message, // Validation errors are safe to show
    NOT_FOUND: 'The requested resource was not found',
    AUTHENTICATION_ERROR: 'Please log in to continue',
    AUTHORIZATION_ERROR: 'You do not have permission to perform this action',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
    // Generic fallback for unexpected errors
    DEFAULT: 'An unexpected error occurred. Please try again.',
  };

  return {
    message: userMessages[error.code] || userMessages.DEFAULT,
    code: error.code,
  };
}

function toInternalLog(error: AppError, requestContext: any): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: error.message,
    error: {
      name: error.name,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      context: error.context,
    },
    request: {
      id: requestContext.requestId,
      userId: requestContext.userId,
      path: requestContext.path,
      method: requestContext.method,
    },
  };
}
```

### Backend API Response Format

```typescript
// Express/Node.js example
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    // Known application error
    logger.error(toInternalLog(err, req));

    return res.status(err.statusCode).json({
      error: toUserError(err),
    });
  }

  // Unknown error - log everything, show generic message
  logger.error({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: 'Unexpected error',
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    request: {
      id: req.id,
      userId: req.user?.id,
      path: req.path,
      method: req.method,
    },
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});
```

## Context Preservation

### Pattern: Wrap errors without losing context

```typescript
// ❌ BAD: Loses original error
async function fetchUserPosts(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}/posts`);
    return response.json();
  } catch (err) {
    // Original error is lost!
    throw new Error('Failed to fetch posts');
  }
}

// ✅ GOOD: Preserves original error with cause
async function fetchUserPosts(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}/posts`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (err) {
    throw new AppError(
      'Failed to fetch user posts',
      'EXTERNAL_SERVICE_ERROR',
      502,
      {
        userId,
        originalError: err instanceof Error ? err.message : String(err),
        cause: err, // Include original error
      }
    );
  }
}
```

### Pattern: Add context at each layer

```typescript
// Controller layer
async function getUserProfile(req: Request, res: Response) {
  try {
    const profile = await userService.getProfile(req.params.userId);
    res.json(profile);
  } catch (err) {
    if (err instanceof AppError) {
      throw err; // Already has context
    }
    // Add request context for unexpected errors
    throw new AppError(
      'Failed to get user profile',
      'INTERNAL_ERROR',
      500,
      {
        userId: req.params.userId,
        requestId: req.id,
        cause: err,
      }
    );
  }
}

// Service layer
async function getProfile(userId: string): Promise<UserProfile> {
  try {
    const user = await db.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    const posts = await getRecentPosts(userId);
    return { user, posts };
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Add service context
    throw new AppError(
      'Failed to load profile data',
      'DATABASE_ERROR',
      500,
      { userId, cause: err }
    );
  }
}
```

## Structured Logging

### Log Format

```typescript
interface LogEntry {
  timestamp: string; // ISO 8601
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  context?: {
    userId?: string;
    requestId?: string;
    sessionId?: string;
    [key: string]: any;
  };
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
    context?: Record<string, any>;
  };
}

// Example log entry
{
  "timestamp": "2026-02-20T10:30:00.000Z",
  "level": "ERROR",
  "message": "Failed to process payment",
  "context": {
    "userId": "user_123",
    "requestId": "req_abc",
    "orderId": "order_456"
  },
  "error": {
    "name": "ExternalServiceError",
    "message": "External service Stripe failed",
    "code": "EXTERNAL_SERVICE_ERROR",
    "stack": "ExternalServiceError: ...",
    "context": {
      "service": "Stripe",
      "originalError": "Card declined"
    }
  }
}
```

### Logging Levels

- **ERROR** – Failures that need attention (500 errors, external service failures, unexpected exceptions)
- **WARN** – Recoverable issues (retries, fallbacks used, deprecated API calls)
- **INFO** – Expected errors (validation failures, 404s, rate limits) or normal operations
- **DEBUG** – Verbose debugging information (not in production)

```typescript
// ERROR: Unexpected failure
logger.error('Failed to process payment', {
  error: err,
  userId,
  orderId,
});

// WARN: Recoverable issue
logger.warn('Cache miss, falling back to database', {
  key: cacheKey,
  userId,
});

// INFO: Expected error
logger.info('Validation failed', {
  error: validationError,
  field: 'email',
});
```

## React Error Boundaries

### Class Component Error Boundary

```typescript
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('React Error Boundary caught:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error tracking
    // trackError(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>We're sorry for the inconvenience. Please refresh the page.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Usage

```typescript
// Wrap entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Wrap specific features
<ErrorBoundary
  fallback={<div>Failed to load user profile. Please try again.</div>}
  onError={(error) => trackError(error)}
>
  <UserProfile userId={userId} />
</ErrorBoundary>
```

### Async Error Handling in React

Error boundaries don't catch:
- Async errors (promises, setTimeout, event handlers)
- Errors in event handlers

Handle these separately:

```typescript
function UserProfile({ userId }: Props) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await fetchProfile(userId);
        setProfile(profile);
      } catch (err) {
        setError(err as Error);
        trackError(err); // Log to monitoring
      }
    }
    loadProfile();
  }, [userId]);

  if (error) {
    return <div>Failed to load profile: {error.message}</div>;
  }

  // ... rest of component
}
```

## Graceful Degradation

### Pattern: Show partial content instead of failing completely

```typescript
// ❌ BAD: One failure breaks everything
async function Dashboard() {
  const user = await fetchUser(); // If this fails, everything fails
  const posts = await fetchPosts();
  const notifications = await fetchNotifications();

  return (
    <div>
      <UserInfo user={user} />
      <PostList posts={posts} />
      <NotificationList notifications={notifications} />
    </div>
  );
}

// ✅ GOOD: Each section handles its own errors
function Dashboard() {
  return (
    <div>
      <ErrorBoundary fallback={<UserInfoPlaceholder />}>
        <UserInfo />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div>Unable to load posts</div>}>
        <PostList />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div>Unable to load notifications</div>}>
        <NotificationList />
      </ErrorBoundary>
    </div>
  );
}

// Or with promise handling
async function Dashboard() {
  const [userResult, postsResult, notificationsResult] = await Promise.allSettled([
    fetchUser(),
    fetchPosts(),
    fetchNotifications(),
  ]);

  return (
    <div>
      {userResult.status === 'fulfilled' ? (
        <UserInfo user={userResult.value} />
      ) : (
        <UserInfoPlaceholder />
      )}

      {postsResult.status === 'fulfilled' ? (
        <PostList posts={postsResult.value} />
      ) : (
        <div>Unable to load posts</div>
      )}

      {notificationsResult.status === 'fulfilled' ? (
        <NotificationList notifications={notificationsResult.value} />
      ) : (
        <div>Unable to load notifications</div>
      )}
    </div>
  );
}
```

### Pattern: Fallback to cached/default data

```typescript
async function getRecommendations(userId: string): Promise<Product[]> {
  try {
    return await recommendationService.getForUser(userId);
  } catch (err) {
    logger.warn('Recommendation service failed, using defaults', {
      userId,
      error: err,
    });
    // Graceful degradation: show popular products instead
    return await getPopularProducts();
  }
}
```

## Anti-Patterns

### ❌ Swallowing errors

```typescript
// ❌ BAD: Error is lost
try {
  await riskyOperation();
} catch (err) {
  // Silent failure - no one knows this failed
}

// ✅ GOOD: At minimum, log the error
try {
  await riskyOperation();
} catch (err) {
  logger.error('Risky operation failed', { error: err });
  throw err; // Or handle appropriately
}
```

### ❌ Generic error messages

```typescript
// ❌ BAD: Not actionable
throw new Error('Something went wrong');

// ✅ GOOD: Specific and actionable
throw new ValidationError('Email must be a valid email address', 'email');
```

### ❌ Exposing sensitive information

```typescript
// ❌ BAD: Exposes stack trace to users
res.status(500).json({ error: err.stack });

// ❌ BAD: Exposes internal details
throw new Error(`Database connection failed: ${dbConfig.password}`);

// ✅ GOOD: Safe user message, detailed internal log
logger.error('Database connection failed', { config: dbConfig });
res.status(500).json({ error: { message: 'Service temporarily unavailable' } });
```

### ❌ Not preserving error context

```typescript
// ❌ BAD: Loses context when re-throwing
catch (err) {
  throw new Error('Failed to save');
}

// ✅ GOOD: Preserves context
catch (err) {
  throw new AppError('Failed to save user', 'DATABASE_ERROR', 500, {
    userId,
    cause: err,
  });
}
```

## Serverless Functions (AWS Lambda)

### Pattern: Catch errors at handler boundary

```typescript
// Lambda handler with error handling
export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Parse and validate input
    const body = JSON.parse(event.body || '{}');
    if (!body.email) {
      throw new ValidationError('Email is required', 'email');
    }

    // Business logic
    const result = await processRequest(body);

    // Success response
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    // Handle known errors
    if (err instanceof AppError) {
      logger.error(toInternalLog(err, { requestId: event.requestId }));

      return {
        statusCode: err.statusCode,
        body: JSON.stringify({ error: toUserError(err) }),
      };
    }

    // Unknown error
    logger.error('Unexpected error in Lambda', {
      error: err,
      requestId: event.requestId,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      }),
    };
  }
};
```

## References

- [Error Handling in Node.js](https://nodejs.org/en/docs/guides/error-handling/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [AWS Lambda Error Handling](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-exceptions.html)
