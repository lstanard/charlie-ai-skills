// STEP 0: Everything in one component
// Problems: Mixing view, domain logic, and data fetching

import { useEffect, useState } from 'react';

interface UserAPI {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  subscription_end_date: string | null;
}

export function UserProfile() {
  const [user, setUser] = useState<UserAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DATA LAYER: Fetch logic in component
  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // DATA LAYER: Update logic in component
  const handleUpgradePlan = () => {
    fetch('/api/user/upgrade', { method: 'POST' })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => setError(err.message));
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  // DOMAIN LOGIC: Computing plan label
  const planLabel =
    user.plan === 'free'
      ? 'Free Plan'
      : user.plan === 'pro'
      ? 'Pro Plan'
      : 'Enterprise Plan';

  // DOMAIN LOGIC: Computing subscription status
  const isSubscriptionActive =
    user.subscription_end_date &&
    new Date(user.subscription_end_date) > new Date();

  // DOMAIN LOGIC: Formatting date
  const subscriptionEndFormatted = user.subscription_end_date
    ? new Date(user.subscription_end_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // DOMAIN LOGIC: Can user upgrade?
  const canUpgrade = user.plan === 'free' || user.plan === 'pro';

  // DOMAIN LOGIC: Avatar fallback
  const avatarUrl = user.avatar_url || '/default-avatar.png';

  // VIEW: Rendering
  return (
    <div className="user-profile">
      <img src={avatarUrl} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.email}</p>

      <div className="plan-info">
        <h2>{planLabel}</h2>
        {isSubscriptionActive ? (
          <p>Active until {subscriptionEndFormatted}</p>
        ) : (
          <p>No active subscription</p>
        )}
      </div>

      {canUpgrade && (
        <button onClick={handleUpgradePlan}>Upgrade Plan</button>
      )}
    </div>
  );
}

// PROBLEMS:
// 1. Data fetching mixed with rendering logic
// 2. Domain logic (plan labels, date formatting, canUpgrade) in component
// 3. Hard to test: must render component to test business rules
// 4. Hard to reuse: fetch logic can't be reused in other components
// 5. Changing API client (e.g., switching to GraphQL) requires editing components
// 6. Component has too many responsibilities
