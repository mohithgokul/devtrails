import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/surakshapay-logo.png';
import { ArrowLeft, Mail, Lock, ShieldCheck } from 'lucide-react';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async () => {
        if (!email || !password) return;
        setIsLoading(true);
        setErrorMsg('');
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.role === 'admin') {
                    localStorage.setItem('surakshapay_admin', JSON.stringify({
                        id: data.user_id,
                        name: data.name,
                        token: data.token,
                        role: data.role
                    }));
                    navigate('/admin');
                } else {
                    setErrorMsg('Unauthorized access. Admin privileges required.');
                }
            } else {
                setErrorMsg('Invalid credentials');
            }
        } catch (error) {
            setErrorMsg('Unable to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-admin flex flex-col px-5">
            <div className="max-w-md mx-auto w-full flex flex-col flex-1 pt-6">
                <button onClick={() => navigate('/role-select')} className="flex items-center gap-1 text-sm text-admin-muted hover:text-admin-foreground transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="text-center mb-8 animate-fade-in-up">
                    <img src={logo} alt="SurakshaPay" className="w-32 h-auto mx-auto mb-4 invert mix-blend-screen" />
                    <h1 className="text-2xl font-bold text-admin-foreground">Insurer Portal</h1>
                    <p className="text-sm text-admin-muted mt-1">Secure admin access</p>
                    <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-admin-accent/20 text-admin-accent text-xs font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> Secure Admin Access
                    </div>
                </div>

                <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-admin-border bg-admin-card text-admin-foreground text-sm font-medium placeholder:text-admin-muted focus:border-admin-accent focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-admin-border bg-admin-card text-admin-foreground text-sm font-medium placeholder:text-admin-muted focus:border-admin-accent focus:outline-none transition-colors"
                        />
                    </div>

                    {errorMsg && (
                        <p className="text-red-500 text-xs font-semibold text-center mb-2">{errorMsg}</p>
                    )}
                    <button
                        onClick={handleLogin}
                        disabled={!email || !password || isLoading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-admin to-admin-accent text-white font-semibold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all active:scale-[0.98]"
                    >
                        {isLoading ? 'Authenticating...' : 'Login to Dashboard'}
                    </button>
                </div>

                <p className="text-center text-xs text-admin-muted mt-6">
                    Admin accounts are pre-provisioned. Contact your organization for access.
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
