// STEP 1: Extract state and side effects into custom hooks
// Improvement: Component focuses on rendering, hooks handle state

import { useEffect, useState } from 'react';

interface UserAPI {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  subscription_end_date: string | null;
}

// Custom hook: Encapsulates fetching and state management
function useUserProfile() {
  const [user, setUser] = useState<UserAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const upgradePlan = () => {
    fetch('/api/user/upgrade', { method: 'POST' })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => setError(err.message));
  };

  return { user, loading, error, upgradePlan };
}

export function UserProfile() {
  const { user, loading, error, upgradePlan } = useUserProfile();

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  // DOMAIN LOGIC still in component (will fix in step 2)
  const planLabel =
    user.plan === 'free'
      ? 'Free Plan'
      : user.plan === 'pro'
      ? 'Pro Plan'
      : 'Enterprise Plan';

  const isSubscriptionActive =
    user.subscription_end_date &&
    new Date(user.subscription_end_date) > new Date();

  const subscriptionEndFormatted = user.subscription_end_date
    ? new Date(user.subscription_end_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const canUpgrade = user.plan === 'free' || user.plan === 'pro';
  const avatarUrl = user.avatar_url || '/default-avatar.png';

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

      {canUpgrade && <button onClick={upgradePlan}>Upgrade Plan</button>}
    </div>
  );
}

// IMPROVEMENTS:
// ✅ State management extracted to custom hook
// ✅ Component focuses on rendering
// ✅ Hook is reusable in other components
//
// REMAINING PROBLEMS:
// ❌ Domain logic still in component
// ❌ Fetch calls still inline in hook
