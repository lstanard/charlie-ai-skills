// BEFORE: Fetch calls scattered in components and hooks
// Problems: URLs in components, hard to change API, duplication

import { useEffect, useState } from 'react';

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

  // DATA LAYER: Fetch in component
  useEffect(() => {
    fetch(`/api/posts/${postId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch post');
        return res.json();
      })
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [postId]);

  // DATA LAYER: Update in component
  const handleLike = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to like post');
      const updated = await res.json();
      setPost(updated);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // DATA LAYER: Delete in component
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete post');
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

// PROBLEMS:
// 1. API URLs (`/api/posts/${postId}`) hardcoded in component
// 2. Fetch error handling duplicated across components
// 3. Hard to switch from REST to GraphQL (need to edit all components)
// 4. Hard to mock for tests (need to mock global fetch)
// 5. No centralized error handling or retry logic
// 6. Component knows about HTTP methods, status codes, etc.
