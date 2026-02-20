// STEP 2: Add domain model to encapsulate business logic
// Improvement: Domain logic moves to User class

import { useEffect, useState } from 'react';

interface UserAPI {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  subscription_end_date: string | null;
}

// DOMAIN LAYER: User model with business logic
class User {
  constructor(private data: UserAPI) {}

  get id() {
    return this.data.id;
  }

  get name() {
    return this.data.name;
  }

  get email() {
    return this.data.email;
  }

  get avatarUrl() {
    return this.data.avatar_url || '/default-avatar.png';
  }

  get planLabel() {
    switch (this.data.plan) {
      case 'free':
        return 'Free Plan';
      case 'pro':
        return 'Pro Plan';
      case 'enterprise':
        return 'Enterprise Plan';
    }
  }

  get isSubscriptionActive() {
    if (!this.data.subscription_end_date) return false;
    return new Date(this.data.subscription_end_date) > new Date();
  }

  get subscriptionEndFormatted() {
    if (!this.data.subscription_end_date) return null;
    return new Date(this.data.subscription_end_date).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  }

  get canUpgrade() {
    return this.data.plan === 'free' || this.data.plan === 'pro';
  }

  static fromAPI(data: UserAPI): User {
    return new User(data);
  }
}

// Hook now returns domain model, not raw API data
function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(data => {
        setUser(User.fromAPI(data)); // Convert to domain model
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
      .then(data => setUser(User.fromAPI(data)))
      .catch(err => setError(err.message));
  };

  return { user, loading, error, upgradePlan };
}

export function UserProfile() {
  const { user, loading, error, upgradePlan } = useUserProfile();

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  // VIEW LAYER: Just rendering domain model properties
  return (
    <div className="user-profile">
      <img src={user.avatarUrl} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.email}</p>

      <div className="plan-info">
        <h2>{user.planLabel}</h2>
        {user.isSubscriptionActive ? (
          <p>Active until {user.subscriptionEndFormatted}</p>
        ) : (
          <p>No active subscription</p>
        )}
      </div>

      {user.canUpgrade && <button onClick={upgradePlan}>Upgrade Plan</button>}
    </div>
  );
}

// IMPROVEMENTS:
// ✅ Domain logic in User class (testable without React)
// ✅ Component is pure presentation
// ✅ User model is reusable
//
// REMAINING PROBLEMS:
// ❌ Fetch calls still inline in hook
