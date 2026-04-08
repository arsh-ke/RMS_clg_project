import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard, UtensilsCrossed, ClipboardList, ChefHat,
  Package, BarChart3, Brain, Users, LogOut, Bell,
  Menu, X, WifiOff, TableProperties,
  ChevronLeft, Flame,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';

/* ─── Nav items ─── */
const allNavItems = [
  { path: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',  roles: ['admin','manager','staff','kitchen'], color: '#f97316' },
  { path: '/menu',        icon: UtensilsCrossed, label: 'Menu',        roles: ['admin','manager','staff'],           color: '#f472b6' },
  { path: '/tables',      icon: TableProperties, label: 'Tables',      roles: ['admin','manager','staff'],           color: '#34d399' },
  { path: '/orders',      icon: ClipboardList,   label: 'Orders',      roles: ['admin','manager','staff'],           color: '#60a5fa' },
  { path: '/kitchen',     icon: ChefHat,         label: 'Kitchen',     roles: ['admin','manager','kitchen'],         color: '#fb923c' },
  { path: '/inventory',   icon: Package,         label: 'Inventory',   color: '#a78bfa', roles: ['admin','manager'] },
  { path: '/reports',     icon: BarChart3,       label: 'Reports',     color: '#fbbf24', roles: ['admin','manager'] },
  { path: '/ai-insights', icon: Brain,           label: 'AI Insights', color: '#22d3ee', roles: ['admin','manager'] },
  { path: '/users',       icon: Users,           label: 'Users',       color: '#ef4444', roles: ['admin']           },
];

/* ─── Role colors ─── */
const roleConfig = {
  admin:   { color: '#ef4444', label: 'Admin'   },
  manager: { color: '#60a5fa', label: 'Manager' },
  staff:   { color: '#34d399', label: 'Staff'   },
  kitchen: { color: '#f97316', label: 'Kitchen' },
};

/* ─── Nav link item ─── */
const SideNavItem = ({ item, collapsed, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
    >
      <motion.div
        whileHover={{ x: collapsed ? 0 : 3 }}
        whileTap={{ scale: 0.97 }}
        className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group overflow-hidden"
        style={{
          background: isActive ? `${item.color}15` : 'transparent',
          border: `1px solid ${isActive ? `${item.color}35` : 'transparent'}`,
        }}
      >
        {/* Active glow */}
        {isActive && (
          <motion.div
            layoutId="sidebarActiveGlow"
            className="absolute inset-0 rounded-xl"
            style={{ background: `radial-gradient(ellipse at 0% 50%,${item.color}18,transparent 70%)` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}

        {/* Active left bar */}
        {isActive && (
          <motion.div
            layoutId="sidebarActiveBar"
            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
            style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}

        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={isActive
            ? { background: `${item.color}20`, boxShadow: `0 0 12px ${item.color}30` }
            : { background: 'rgba(255,255,255,0.04)' }
          }
        >
          <Icon
            className="w-4 h-4 transition-all duration-200"
            style={{ color: isActive ? item.color : '#71717a' }}
          />
        </div>

        {/* Label */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-semibold whitespace-nowrap overflow-hidden"
              style={{ color: isActive ? item.color : '#a1a1aa' }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Hover state for collapsed */}
        {collapsed && (
          <motion.div
            className="absolute left-full ml-3 z-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-xl"
            style={{ background: '#111116', border: '1px solid rgba(63,63,70,0.8)' }}
          >
            {item.label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent" style={{ borderRightColor: 'rgba(63,63,70,0.8)' }} />
          </motion.div>
        )}
      </motion.div>
    </NavLink>
  );
};

/* ─── Notification item ─── */
const NotifItem = ({ n, index }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04 }}
    className="flex gap-3 p-3 rounded-xl border border-transparent hover:border-zinc-700/50 hover:bg-zinc-800/30 cursor-pointer transition-all duration-150"
  >
    <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
      <Bell className="w-3.5 h-3.5 text-orange-400" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-zinc-200">
        {n.type === 'order_new' ? 'New Order' : 'Order Update'}
      </p>
      <p className="text-[11px] text-zinc-500 truncate">
        {n.data?.orderNumber || 'Order'} · {n.data?.status || 'pending'}
      </p>
    </div>
    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 mt-1" />}
  </motion.div>
);

/* ═══════════════════════════════════════════ */
const Layout = () => {
  const { user, logout } = useAuth();
  const { isConnected, notifications, clearNotifications } = useSocket();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const filteredNav = allNavItems.filter(i => i.roles.includes(user?.role));
  const unread = notifications.filter(n => !n.read).length;
  const roleCfg = roleConfig[user?.role] || roleConfig.staff;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const hour = time.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ── Sidebar content (shared between mobile + desktop) ── */
  const SidebarContent = ({ onNav }) => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800/80 flex items-center justify-between">
        <AnimatePresence initial={false} mode="wait">
          {!collapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-xl font-black tracking-tight">
                <span className="text-orange-500">NEXA</span>
                <span className="text-white"> EATS</span>
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto"
            >
              <Flame className="w-4 h-4 text-orange-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle — desktop only */}
        {onNav === undefined && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
          </button>
        )}

        {/* Close — mobile only */}
        {onNav !== undefined && (
          <button onClick={onNav} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-3 px-3">
        <div className="space-y-0.5">
          {filteredNav.map((item, i) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <SideNavItem item={item} collapsed={collapsed} onClick={onNav} />
            </motion.div>
          ))}
        </div>


      </ScrollArea>

      {/* User profile at bottom */}
      <div className={`p-3 border-t border-zinc-800/80 ${collapsed ? '' : ''}`}>
        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-800/40 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          onClick={handleLogout}
          title="Logout"
        >
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 relative"
            style={{ background: `${roleCfg.color}20`, border: `1.5px solid ${roleCfg.color}40`, color: roleCfg.color }}
          >
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: roleCfg.color }}>
                  {roleCfg.label}
                </span>
              </div>
            </div>
          )}

          {!collapsed && (
            <LogOut className="w-3.5 h-3.5 text-zinc-600 hover:text-red-400 flex-shrink-0 transition-colors" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#09090b' }}>

      {/* ── Mobile Header ── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between border-b border-zinc-800/80"
        style={{ background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <span className="text-base font-black tracking-tight">
            <span className="text-orange-500">NEXA</span><span className="text-white"> EATS</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isConnected
            ? <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#34d399]" />
            : <span className="w-2 h-2 rounded-full bg-red-500" />
          }
        </div>
      </header>

      {/* ── Mobile Sidebar Backdrop ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 border-r border-zinc-800/80"
              style={{ background: 'linear-gradient(180deg,#0e0e12 0%,#09090b 100%)' }}
            >
              <SidebarContent onNav={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r border-zinc-800/80 overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#0f0f13 0%,#09090b 100%)' }}
      >
        <SidebarContent />
      </motion.aside>

      {/* ── Main Area ── */}
      <motion.div
        animate={{ marginLeft: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen hidden lg:block"
      >
        {/* Desktop Topbar */}
        <header
          className="sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between border-b border-zinc-800/60"
          style={{ background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(16px)' }}
        >
          {/* Left: greeting */}
          <div>
            <p className="text-xs text-zinc-600 font-medium">{greeting} 👋</p>
            <h2 className="text-sm font-bold text-zinc-300 leading-tight">
              Welcome back, <span className="text-white">{user?.name?.split(' ')[0]}</span>
            </h2>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2.5">
            {/* Connection status */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold"
              style={isConnected
                ? { background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.25)', color: '#34d399' }
                : { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444' }
              }
            >
              {isConnected ? (
                <><motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} /> Live</>
              ) : (
                <><WifiOff className="w-3 h-3" /> Offline</>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all"
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 0 8px rgba(249,115,22,0.6)' }}
                  >
                    {unread > 9 ? '9+' : unread}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-full mt-2 w-80 rounded-2xl border z-50 overflow-hidden shadow-2xl"
                      style={{ background: '#0f0f13', borderColor: 'rgba(39,39,42,0.9)' }}
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                        <div>
                          <p className="text-xs font-black text-zinc-100 uppercase tracking-widest">Notifications</p>
                          {unread > 0 && <p className="text-[10px] text-orange-400 font-semibold mt-0.5">{unread} unread</p>}
                        </div>
                        {notifications.length > 0 && (
                          <button onClick={clearNotifications} className="text-[11px] text-zinc-600 hover:text-orange-400 font-semibold transition-colors">
                            Clear all
                          </button>
                        )}
                      </div>
                      <ScrollArea className="max-h-72 p-2">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center py-8 gap-2">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                              <Bell className="w-5 h-5 text-zinc-600" />
                            </div>
                            <p className="text-xs text-zinc-600">No notifications</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n, i) => <NotifItem key={i} n={n} index={i} />)
                        )}
                      </ScrollArea>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-all"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                    style={{ background: `${roleCfg.color}20`, color: roleCfg.color }}
                  >
                    {initials}
                  </div>
                  <span className="text-sm font-semibold text-zinc-300 max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
                style={{ background: '#0f0f13' }}
              >
                <DropdownMenuLabel className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: `${roleCfg.color}20`, color: roleCfg.color }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-100 truncate">{user?.name}</p>
                      <p className="text-[11px] truncate" style={{ color: roleCfg.color }}>{user?.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2.5 rounded-lg mx-1 mb-1 focus:bg-red-500/10 focus:text-red-400"
                  style={{ color: '#f87171' }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </main>
      </motion.div>

      {/* Mobile content */}
      <div className="lg:hidden pt-16 min-h-screen">
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;