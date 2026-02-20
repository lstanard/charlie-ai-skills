// DATA LAYER: Dedicated API client
// All network logic in one place

interface Post {
  id: string;
  title: string;
  body: string;
  authorId: string;
}

interface CreatePostInput {
  title: string;
  body: string;
}

class PostAPIClient {
  private baseUrl = '/api/posts';

  // Centralized error handling
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'API request failed');
    }
    return response.json();
  }

  // GET /api/posts/:id
  async getPost(id: string): Promise<Post> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    return this.handleResponse<Post>(response);
  }

  // GET /api/posts
  async listPosts(): Promise<Post[]> {
    const response = await fetch(this.baseUrl);
    return this.handleResponse<Post[]>(response);
  }

  // POST /api/posts
  async createPost(input: CreatePostInput): Promise<Post> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return this.handleResponse<Post>(response);
  }

  // POST /api/posts/:id/like
  async likePost(id: string): Promise<Post> {
    const response = await fetch(`${this.baseUrl}/${id}/like`, {
      method: 'POST',
    });
    return this.handleResponse<Post>(response);
  }

  // DELETE /api/posts/:id
  async deletePost(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    await this.handleResponse<void>(response);
  }

  // PATCH /api/posts/:id
  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return this.handleResponse<Post>(response);
  }
}

// Singleton instance
export const postAPI = new PostAPIClient();

// BENEFITS:
// 1. All API URLs in one place (easy to change base URL)
// 2. Consistent error handling across all requests
// 3. Easy to add auth tokens, retry logic, caching
// 4. Easy to mock for tests: mock postAPI instead of global fetch
// 5. Components don't know about HTTP details
// 6. Easy to migrate to GraphQL (change this file, components unchanged)
