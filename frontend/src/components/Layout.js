import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  ChefHat,
  Package,
  BarChart3,
  Brain,
  Users,
  LogOut,
  Bell,
  Menu,
  X,
  Wifi,
  WifiOff,
  Settings,
  TableProperties,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';

const Layout = () => {
  const { user, logout } = useAuth();
  const { isConnected, notifications, clearNotifications } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'staff', 'kitchen'] },
    { path: '/menu', icon: UtensilsCrossed, label: 'Menu', roles: ['admin', 'manager', 'staff'] },
    { path: '/tables', icon: TableProperties, label: 'Tables', roles: ['admin', 'manager', 'staff'] },
    { path: '/orders', icon: ClipboardList, label: 'Orders', roles: ['admin', 'manager', 'staff'] },
    { path: '/kitchen', icon: ChefHat, label: 'Kitchen', roles: ['admin', 'manager', 'kitchen'] },
    { path: '/inventory', icon: Package, label: 'Inventory', roles: ['admin', 'manager'] },
    { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'manager'] },
    { path: '/ai-insights', icon: Brain, label: 'AI Insights', roles: ['admin', 'manager'] },
    { path: '/users', icon: Users, label: 'Users', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-zinc-800 rounded-md">
            <Menu className="h-6 w-6 text-zinc-400" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-orange-500">NEXA</span> EATS
          </h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 z-50"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-orange-500">NEXA</span> EATS
                </h1>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-zinc-800 rounded-md">
                  <X className="h-5 w-5 text-zinc-400" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-zinc-950 border-r border-zinc-800 transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-56 xl:w-64' : 'w-20'
        }`}
      >
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-orange-500">NEXA</span> EATS
            </h1>
          ) : (
            <span className="text-xl font-bold text-orange-500">N</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                } ${!sidebarOpen ? 'justify-center' : ''}`
              }
              title={item.label}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-zinc-500 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300`} style={{ marginLeft: sidebarOpen ? (window.innerWidth >= 1280 ? '16rem' : '14rem') : '5rem' }}>
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 px-6 py-3 items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-zinc-300">Restaurant Management System</h2>
            {isConnected ? (
              <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                <Wifi className="h-3 w-3 mr-1" /> Live
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
                <WifiOff className="h-3 w-3 mr-1" /> Offline
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-zinc-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-xs flex items-center justify-center text-black font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-zinc-900 border-zinc-800">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className="text-xs text-zinc-500 hover:text-orange-500">
                      Clear all
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <ScrollArea className="h-64">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-sm">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((notification, index) => (
                      <DropdownMenuItem key={index} className="flex flex-col items-start p-3 cursor-pointer">
                        <span className="text-sm font-medium text-white">
                          {notification.type === 'order_new' ? 'New Order' : 'Order Update'}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {notification.data?.orderNumber || 'Order'} - {notification.data?.status || 'pending'}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-zinc-300">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                <DropdownMenuLabel>
                  <div>
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-zinc-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-500 focus:text-red-500">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 pt-20 lg:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
