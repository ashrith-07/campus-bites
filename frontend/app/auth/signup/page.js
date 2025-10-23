'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signup(formData.name, formData.email, formData.password);
    if (result.success) router.push('/');
    else setError(result.error);

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="bg-card w-full max-w-md shadow-elegant rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-foreground">Join Campus Bites</h1>
          <p className="text-muted-foreground">
            Create an account to start ordering delicious meals
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-foreground mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-secondary transition-elegant"
            />
          </div>

          <div>
            <label className="block text-foreground mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="your.email@university.edu"
              required
              className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-secondary transition-elegant"
            />
          </div>

          <div>
            <label className="block text-foreground mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-secondary transition-elegant"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-elegant disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-secondary hover:underline transition-elegant"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
