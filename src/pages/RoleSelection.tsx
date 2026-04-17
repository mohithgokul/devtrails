import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/surakshapay-logo.png';
import { Bike, Building2 } from 'lucide-react';

const RoleSelection = () => {
    const navigate = useNavigate();
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    const roles = [
        {
            id: 'worker',
            icon: Bike,
            emoji: '🛵',
            label: "I'm a Delivery Worker",
            subtext: 'Manage your coverage, claims & earnings',
            button: 'Continue as Worker',
            gradient: 'from-primary to-secondary',
            path: '/worker-login',
        },
        {
            id: 'admin',
            icon: Building2,
            emoji: '🏛️',
            label: "I'm an Insurer (Admin)",
            subtext: 'View loss ratios, risk analytics & policy data',
            button: 'Continue as Admin',
            gradient: 'from-admin to-admin-accent',
            path: '/admin-login',
        },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <img src={logo} alt="SurakshaPay" className="w-40 h-auto mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground">Welcome to SurakshaPay</h1>
                    <p className="text-sm text-muted-foreground mt-1">Who are you logging in as?</p>
                </div>

                {/* Role Cards */}
                <div className="space-y-4">
                    {roles.map((role, i) => (
                        <button
                            key={role.id}
                            onClick={() => navigate(role.path)}
                            onMouseEnter={() => setHoveredCard(role.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 animate-fade-in-up ${hoveredCard === role.id
                                    ? 'scale-[1.02] shadow-xl border-primary/50'
                                    : 'border-border shadow-md hover:shadow-lg'
                                }`}
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                <span className="text-2xl">{role.emoji}</span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">{role.label}</h3>
                            <p className="text-xs text-muted-foreground mb-4">{role.subtext}</p>
                            <div className={`w-full py-3 rounded-xl bg-gradient-to-r ${role.gradient} text-center text-sm font-semibold text-primary-foreground shadow-md`}>
                                {role.button}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;