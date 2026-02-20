# Data Layer Pattern: API Client Example

This example demonstrates extracting network calls into a **dedicated data layer** (API client) to separate concerns and improve maintainability.

## Problem

In `before.tsx`, the component has inline fetch calls:
- ❌ API URLs hardcoded: `/api/posts/${postId}`
- ❌ HTTP details in component: methods, headers, status codes
- ❌ Error handling duplicated across components
- ❌ Hard to change: switching from REST to GraphQL requires editing all components
- ❌ Hard to test: must mock global `fetch`

## Solution

Create a `PostAPIClient` class (`api-client.ts`) that:
- ✅ Encapsulates all API endpoints
- ✅ Provides typed methods: `getPost(id)`, `likePost(id)`, `deletePost(id)`
- ✅ Centralizes error handling in `handleResponse()`
- ✅ Easy to extend: add auth tokens, retry logic, caching

The component (`after.tsx`) uses the client:
```ts
const post = await postAPI.getPost(postId);
const updated = await postAPI.likePost(postId);
await postAPI.deletePost(postId);
```

No URLs, no HTTP details, just clean method calls.

## Benefits

### 1. Single Source of Truth
All API logic in one file:
- Change base URL? Edit `baseUrl` in api-client.ts
- Add auth header? Add it in `handleResponse()`
- Switch from REST to GraphQL? Reimplement api-client.ts, components unchanged

### 2. Testability
**Before:** Mock global fetch
```ts
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => mockPost,
});
```

**After:** Mock API client
```ts
jest.mock('./api-client');
postAPI.getPost = jest.fn().mockResolvedValue(mockPost);
```

Much cleaner! Mock methods, not fetch details.

### 3. Type Safety
```ts
// Typed method
async getPost(id: string): Promise<Post>

// Component gets type-safe result
const post: Post = await postAPI.getPost(postId);
```

No casting, no `as Post`, just types flowing through.

### 4. Extensibility
Easy to add cross-cutting concerns:

**Auth tokens:**
```ts
private async fetch(url: string, options?: RequestInit) {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}
```

**Retry logic:**
```ts
private async fetchWithRetry(url: string, retries = 3) {
  try {
    return await fetch(url);
  } catch (err) {
    if (retries > 0) return this.fetchWithRetry(url, retries - 1);
    throw err;
  }
}
```

**Caching:**
```ts
private cache = new Map<string, Post>();

async getPost(id: string): Promise<Post> {
  if (this.cache.has(id)) return this.cache.get(id)!;
  const post = await this.fetchPost(id);
  this.cache.set(id, post);
  return post;
}
```

All in the data layer—components unaware.

## When to Use

**Use a data layer when:**
- ✅ Multiple components fetch from the same API
- ✅ You want to centralize error handling or add retry logic
- ✅ You might switch from REST to GraphQL (or vice versa)
- ✅ You want testable components without mocking fetch

**Don't use when:**
- ❌ Single trivial fetch in one component (overkill)
- ❌ Using a full data-fetching library (React Query, SWR, Apollo Client) that handles this

## Advanced: Combining with React Query

For production apps, combine data layer with React Query:

```ts
// api-client.ts stays the same

// In component:
function useBlogPost(postId: string) {
  return useQuery(['post', postId], () => postAPI.getPost(postId));
}

export function BlogPost({ postId }: Props) {
  const { data: post, isLoading, error } = useBlogPost(postId);
  // ...
}
```

React Query handles caching, refetching, background updates.
API client handles network details.
Component just renders.

## References

- [Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) - See "Data Layer" section
- Skill: `skills/frontend-architecture/react-data-layer/`
- [React Query](https://tanstack.com/query/latest) - For advanced data fetching patterns
