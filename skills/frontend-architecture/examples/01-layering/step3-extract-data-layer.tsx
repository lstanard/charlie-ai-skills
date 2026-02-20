// STEP 3: Extract data fetching into dedicated API client
// Improvement: Data layer is separate from hooks and components

import { useEffect, useState } from 'react';

interface UserAPI {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  subscription_end_date: string | null;
}

// DOMAIN LAYER: User model
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
    const labels = {
      free: 'Free Plan',
      pro: 'Pro Plan',
      enterprise: 'Enterprise Plan',
    };
    return labels[this.data.plan];
  }
  get isSubscriptionActive() {
    if (!this.data.subscription_end_date) return false;
    return new Date(this.data.subscription_end_date) > new Date();
  }
  get subscriptionEndFormatted() {
    if (!this.data.subscription_end_date) return null;
    return new Date(this.data.subscription_end_date).toLocaleDateString(
      'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  }
  get canUpgrade() {
    return this.data.plan === 'free' || this.data.plan === 'pro';
  }

  static fromAPI(data: UserAPI): User {
    return new User(data);
  }
}

// DATA LAYER: API client with all network logic
class UserAPIClient {
  private baseUrl = '/api/user';

  async getProfile(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/profile`);
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    const data = await response.json();
    return User.fromAPI(data);
  }

  async upgradePlan(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/upgrade`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to upgrade plan');
    }
    const data = await response.json();
    return User.fromAPI(data);
  }
}

// Singleton instance
const userAPI = new UserAPIClient();

// Hook uses data layer, returns domain models
function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userAPI
      .getProfile()
      .then(user => {
        setUser(user);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const upgradePlan = () => {
    userAPI
      .upgradePlan()
      .then(user => setUser(user))
      .catch(err => setError(err.message));
  };

  return { user, loading, error, upgradePlan };
}

// VIEW LAYER: Pure presentation
export function UserProfile() {
  const { user, loading, error, upgradePlan } = useUserProfile();

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

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

// FINAL STATE:
// ✅ VIEW: Component only renders
// ✅ DOMAIN: User model has business logic
// ✅ DATA: UserAPIClient handles network
// ✅ Each layer can be tested independently
// ✅ Easy to change (e.g., switch from REST to GraphQL in data layer)
