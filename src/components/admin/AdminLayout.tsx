import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/surakshapay-logo.png';
import { cn } from '@/lib/utils';
import {
    BarChart3, TrendingDown, BrainCircuit, ClipboardList, FileText, Users,
    Bell, Settings, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';

const navItems = [
    { path: '/admin', label: 'Overview', icon: BarChart3 },
    { path: '/admin/loss-ratios', label: 'Loss Ratios', icon: TrendingDown },
    { path: '/admin/predictive', label: 'Predictive Analytics', icon: BrainCircuit },
    { path: '/admin/claims', label: 'Claims Management', icon: ClipboardList },
    { path: '/admin/policies', label: 'Policies', icon: FileText },
    { path: '/admin/workers', label: 'Workers', icon: Users },
];

interface AdminLayoutProps {
    children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-admin-content flex">
            {/* Sidebar Overlay (mobile) */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={cn(
                'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-admin flex flex-col transition-transform duration-300 lg:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className="p-5 flex items-center justify-between border-b border-admin-border">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="SurakshaPay" className="w-28 h-auto brightness-0 invert" />
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-admin-muted hover:text-admin-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Insurer Portal</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-admin-accent text-white shadow-md'
                                        : 'text-admin-muted hover:text-admin-foreground hover:bg-admin-card'
                                )}
                            >
                                <item.icon className="w-4.5 h-4.5" />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="p-4 border-t border-admin-border">
                    <button onClick={() => navigate('/role-select')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-admin-muted hover:text-admin-foreground hover:bg-admin-card transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Navbar */}
                <header className="sticky top-0 z-30 bg-white border-b border-border/50 px-4 lg:px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <Menu className="w-5 h-5 text-foreground" />
                        </button>
                        <h2 className="text-sm font-semibold text-foreground hidden sm:block">
                            {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
                            <Bell className="w-4.5 h-4.5 text-muted-foreground" />
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                            <Settings className="w-4.5 h-4.5 text-muted-foreground" />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-admin to-admin-accent flex items-center justify-center text-white text-xs font-bold ml-1">
                            AD
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
