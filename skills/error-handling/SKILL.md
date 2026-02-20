# Error handling
version: 0.1.0

## Purpose
Structured error handling for frontend and backend: custom error classes, error codes, context preservation, logging, user-facing vs internal errors, graceful degradation. Applies to JavaScript/TypeScript, React, Node.js, and serverless functions.

## Triggers
- error handling
- exception handling
- throw error
- try catch
- error boundaries
- logging
- error codes
- graceful degradation
- error messages
- debugging
- production errors

## Inputs

## Guarantees
- Use custom error classes with error codes for categorization (e.g., ValidationError, NotFoundError, AuthenticationError); avoid throwing plain Error objects
- Preserve context: include relevant data (user ID, request ID, resource ID) in error objects; avoid losing context when re-throwing
- Distinguish user-facing errors from internal errors; expose safe messages to users, log detailed errors internally
- Use structured logging with consistent format (JSON logs); include timestamp, level, message, context, stack trace where appropriate
- Implement error boundaries in React to catch rendering errors; provide fallback UI instead of white screen
- Catch errors at boundaries (API handlers, React components, async operations); don't let errors propagate to top-level uncaught
- Log errors with appropriate levels: ERROR for failures, WARN for recoverable issues, INFO for expected errors (e.g., validation failures)
- For backend APIs: return consistent error response format with error code, message, and optional details; use appropriate HTTP status codes
- Graceful degradation: when a feature fails, degrade gracefully rather than crashing; show partial content or fallback behavior
- Never expose sensitive information in error messages (passwords, tokens, internal paths, stack traces in production to end users)

## Non-goals
- Specific error monitoring tools (Sentry, Datadog) - this skill covers error structure, not tool setup
- Language-specific exception handling beyond JavaScript/TypeScript
- Error recovery strategies for distributed systems (circuit breakers, retries) - those are separate patterns
- Performance monitoring or APM - this is about errors, not general observability

## Notes
Custom error class pattern: extend Error, set name and code properties. Example: class ValidationError extends Error { constructor(message, field) { super(message); this.name = 'ValidationError'; this.code = 'VALIDATION_ERROR'; this.field = field; } }. For React: use error boundaries with componentDidCatch or static getDerivedStateFromError. For backend APIs: return { error: { code: 'NOT_FOUND', message: 'Resource not found', details: { resourceId: '123' } } }. For logging: use structured format like { timestamp, level, message, context: { userId, requestId }, error: { name, message, stack } }. Graceful degradation example: if user recommendations API fails, show default content instead of error page. Context preservation: when catching and re-throwing, preserve original error: catch (err) { throw new AppError('Failed to process', { cause: err, userId }); }. See CLAUDE.md for detailed patterns, examples, and anti-patterns.