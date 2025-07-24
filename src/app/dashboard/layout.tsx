'use client';

import { useTenant } from '@/contexts/TenantContext';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, ChevronDown, BarChart3, Package, Users, FileText, Warehouse, ArrowLeftRight, PieChart, Store, Menu, Bell, Search } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useTenantAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while checking authentication or tenant info
  if (tenantLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Check tenant and authentication
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tenant Not Found</h1>
          <p className="text-muted-foreground mb-4">Unable to load tenant information for this domain.</p>
          <Button onClick={() => window.location.href = '/'}>Go to Main Site</Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-xl bg-white/95">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">HonduKash ERP</h1>
                  <p className="text-sm text-slate-500">{tenant.name}</p>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-4 py-2 w-96">
                <Search className="h-4 w-4 text-slate-400 mr-3" />
                <input 
                  type="text" 
                  placeholder="Search products, clients, invoices..." 
                  className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 flex-1"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
              </Button>
              
              {/* Store Selector */}
              <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-3 py-2">
                <Store className="h-4 w-4 text-slate-500 mr-2" />
                <span className="text-sm font-medium text-slate-700">Main Store</span>
                <ChevronDown className="h-4 w-4 text-slate-400 ml-2" />
              </div>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-slate-100 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden md:inline font-medium text-slate-700">{user?.name || 'User'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    <p className="text-xs text-blue-600 capitalize font-medium">{user?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-lg">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="text-red-600 focus:text-red-600 rounded-lg"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Modern Sidebar */}
        <nav className="w-72 min-h-screen bg-white border-r border-slate-200 shadow-sm">
          <div className="p-6 space-y-8">
            {/* Navigation Sections */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Overview</h3>
              <div className="space-y-1">
                <Link href="/dashboard" className={`nav-item ${pathname === '/dashboard' ? 'nav-item-active' : ''}`}>
                  <BarChart3 className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Management</h3>
              <div className="space-y-1">
                <Link href="/stores" className={`nav-item ${pathname === '/stores' ? 'nav-item-active' : ''}`}>
                  <Store className="h-5 w-5 mr-3" />
                  Stores
                </Link>
                <Link href="/clients" className={`nav-item ${pathname === '/clients' ? 'nav-item-active' : ''}`}>
                  <Users className="h-5 w-5 mr-3" />
                  Clients
                </Link>
                <Link href="/products" className={`nav-item ${pathname === '/products' ? 'nav-item-active' : ''}`}>
                  <Package className="h-5 w-5 mr-3" />
                  Products
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Operations</h3>
              <div className="space-y-1">
                <Link href="/invoices" className={`nav-item ${pathname === '/invoices' ? 'nav-item-active' : ''}`}>
                  <FileText className="h-5 w-5 mr-3" />
                  Invoices
                </Link>
                <Link href="/inventory" className={`nav-item ${pathname === '/inventory' ? 'nav-item-active' : ''}`}>
                  <Warehouse className="h-5 w-5 mr-3" />
                  Inventory
                </Link>
                <Link href="/transfers" className={`nav-item ${pathname === '/transfers' ? 'nav-item-active' : ''}`}>
                  <ArrowLeftRight className="h-5 w-5 mr-3" />
                  Transfers
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Analytics</h3>
              <div className="space-y-1">
                <Link href="/reports" className={`nav-item ${pathname === '/reports' ? 'nav-item-active' : ''}`}>
                  <PieChart className="h-5 w-5 mr-3" />
                  Reports
                </Link>
                <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'nav-item-active' : ''}`}>
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="flex-1 p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}