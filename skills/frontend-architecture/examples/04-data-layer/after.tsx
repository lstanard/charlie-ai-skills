// AFTER: Component uses API client
// Improvement: No fetch calls, no URLs, clean separation

import { useEffect, useState } from 'react';
import { postAPI } from './api-client';

interface Post {
  id: string;
  title: string;
  body: string;
  authorId: string;
}

export function BlogPost({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DATA LAYER: Use API client
  useEffect(() => {
    postAPI
      .getPost(postId)
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [postId]);

  // DATA LAYER: Use API client methods
  const handleLike = async () => {
    try {
      const updated = await postAPI.likePost(postId);
      setPost(updated);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async () => {
    try {
      await postAPI.deletePost(postId);
      // Navigate away or show success
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <button onClick={handleLike}>Like</button>
      <button onClick={handleDelete}>Delete</button>
    </article>
  );
}

// IMPROVEMENTS:
// ✅ Component doesn't know about API URLs
// ✅ Component doesn't handle HTTP details (methods, status codes)
// ✅ Easy to test: mock postAPI.getPost() instead of global fetch
// ✅ Changing API (e.g., REST → GraphQL) only requires updating api-client.ts
// ✅ Consistent error handling across all components
//
// Example test:
// jest.mock('./api-client');
// postAPI.getPost = jest.fn().mockResolvedValue(mockPost);
// render(<BlogPost postId="1" />);
// expect(postAPI.getPost).toHaveBeenCalledWith("1");
