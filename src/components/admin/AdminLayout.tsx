import { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/surakshapay-logo.png';
import { cn } from '@/lib/utils';
import {
    BarChart3, TrendingDown, BrainCircuit, ClipboardList, FileText, Users,
    Bell, Settings, LogOut, Menu, X, ChevronRight, CheckCheck, UserPlus,
    AlertCircle, Info,
} from 'lucide-react';

const navItems = [
    { path: '/admin', label: 'Overview', icon: BarChart3 },
    { path: '/admin/loss-ratios', label: 'Loss Ratios', icon: TrendingDown },
    { path: '/admin/predictive', label: 'Predictive Analytics', icon: BrainCircuit },
    { path: '/admin/claims', label: 'Claims Management', icon: ClipboardList },
    { path: '/admin/policies', label: 'Policies', icon: FileText },
    { path: '/admin/workers', label: 'Workers', icon: Users },
];

interface Notification {
    id: number;
    message: string;
    type: 'registration' | 'claim' | 'info';
    is_read: boolean;
    created_at: string;
}

interface AdminLayoutProps {
    children: ReactNode;
}

const notifIcon = (type: string) => {
    if (type === 'registration') return <UserPlus className="w-3.5 h-3.5 text-primary" />;
    if (type === 'claim') return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
    return <Info className="w-3.5 h-3.5 text-muted-foreground" />;
};

const timeAgo = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ── Notification state ───────────────────────────────────────────────────
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // ── Auth guard ───────────────────────────────────────────────────────────
    useEffect(() => {
        const adminData = localStorage.getItem('surakshapay_admin');
        if (!adminData) {
            navigate('/admin-login');
            return;
        }
        try {
            const parsed = JSON.parse(adminData);
            if (parsed.role !== 'admin' || !parsed.token) {
                navigate('/admin-login');
            }
        } catch {
            navigate('/admin-login');
        }
    }, [navigate]);

    // ── Fetch notifications ──────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        const adminStr = localStorage.getItem('surakshapay_admin');
        if (!adminStr) return;
        const admin = JSON.parse(adminStr);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/admin/notifications`, {
                headers: { Authorization: `Bearer ${admin.token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            }
        } catch {
            // silently fail — no disruption if backend is unreachable
        }
    }, []);

    // Poll every 30 s + fetch immediately on mount
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Mark helpers ─────────────────────────────────────────────────────────
    const getToken = () => {
        try { return JSON.parse(localStorage.getItem('surakshapay_admin') || '{}').token; }
        catch { return ''; }
    };

    const markAllRead = async () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        await fetch(`${apiUrl}/api/admin/notifications/mark-all-read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${getToken()}` },
        });
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const markOneRead = async (id: number) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        await fetch(`${apiUrl}/api/admin/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${getToken()}` },
        });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleLogout = () => {
        localStorage.removeItem('surakshapay_admin');
        navigate('/role-select');
    };

    // Derive initials for avatar
    const adminName = (() => {
        try {
            const a = JSON.parse(localStorage.getItem('surakshapay_admin') || '{}');
            return (a.name || 'Admin')
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        } catch { return 'AD'; }
    })();

    return (
        <div className="min-h-screen bg-admin-content flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <aside className={cn(
                'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-admin flex flex-col transition-transform duration-300 lg:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            )}>
                {/* Logo */}
                <div className="p-5 flex items-center justify-between border-b border-admin-border">
                    <img src={logo} alt="SurakshaPay" className="w-28 h-auto invert mix-blend-screen" />
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-admin-muted hover:text-admin-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">
                        Insurer Portal
                    </span>
                </div>

                {/* Nav items */}
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
                                        : 'text-admin-muted hover:text-admin-foreground hover:bg-admin-card',
                                )}
                            >
                                <item.icon className="w-4.5 h-4.5" />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-admin-border">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-admin-muted hover:text-admin-foreground hover:bg-admin-card transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Main area ─────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white border-b border-border/50 px-4 lg:px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                            <Menu className="w-5 h-5 text-foreground" />
                        </button>
                        <h2 className="text-sm font-semibold text-foreground hidden sm:block">
                            {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* ── Notification bell ─────────────────────────── */}
                        <div className="relative" ref={notifRef}>
                            <button
                                id="notif-bell"
                                onClick={() => setNotifOpen(v => !v)}
                                className="p-2 rounded-lg hover:bg-muted transition-colors relative"
                                aria-label="Notifications"
                            >
                                <Bell className="w-4.5 h-4.5 text-muted-foreground" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {notifOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-border/50 z-50 overflow-hidden animate-fade-in-up">
                                    {/* Panel header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-foreground" />
                                            <span className="text-sm font-semibold text-foreground">Notifications</span>
                                            {unreadCount > 0 && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-destructive text-white text-[10px] font-bold">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                                            >
                                                <CheckCheck className="w-3.5 h-3.5" />
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    {/* Notification list */}
                                    <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center">
                                                <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => !n.is_read && markOneRead(n.id)}
                                                    className={cn(
                                                        'flex gap-3 px-4 py-3 transition-colors cursor-pointer',
                                                        n.is_read
                                                            ? 'bg-white hover:bg-muted/20'
                                                            : 'bg-primary/5 hover:bg-primary/10',
                                                    )}
                                                >
                                                    {/* Icon bubble */}
                                                    <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
                                                        {notifIcon(n.type)}
                                                    </div>

                                                    {/* Body */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            'text-xs leading-relaxed',
                                                            n.is_read
                                                                ? 'text-muted-foreground'
                                                                : 'text-foreground font-medium',
                                                        )}>
                                                            {n.message}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            {timeAgo(n.created_at)}
                                                        </p>
                                                    </div>

                                                    {/* Unread dot */}
                                                    {!n.is_read && (
                                                        <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-primary" />
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Panel footer */}
                                    {notifications.length > 0 && (
                                        <div className="px-4 py-2.5 border-t border-border/50 bg-muted/20 text-center">
                                            <p className="text-[11px] text-muted-foreground">
                                                Showing last {notifications.length} notifications
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                            <Settings className="w-4.5 h-4.5 text-muted-foreground" />
                        </button>

                        {/* Admin avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-admin to-admin-accent flex items-center justify-center text-white text-xs font-bold ml-1">
                            {adminName}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
