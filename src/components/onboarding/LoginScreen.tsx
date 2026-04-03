import { useState } from 'react';
import { ArrowLeft, Loader2, Mail, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (userData: any) => void;
  onBack: () => void;
}

const LoginScreen = ({ onLoginSuccess, onBack }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || password.length < 6) {
      setError('Please enter a valid email and password (min 6 chars)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const result = await res.json();
      onLoginSuccess(result);
    } catch (err: any) {
      setError(err.message || 'Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative px-6 pt-12 pb-10">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 p-2 rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back! 👋</h1>
        <p className="text-muted-foreground text-sm mb-10">
          Enter your email and password to access your SurakshaPay account.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground ml-1">Email Address</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-muted border-none rounded-2xl py-4 pl-12 pr-4 font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground/60"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 -mt-2">
            <label className="text-sm font-medium text-foreground ml-1">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-muted border-none rounded-2xl py-4 pl-12 pr-4 font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground/60"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-destructive text-sm font-medium ml-1 mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !email.includes('@') || password.length < 6}
            className="w-full py-4 mt-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            {loading ? 'Logging in...' : 'Login Securely'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
