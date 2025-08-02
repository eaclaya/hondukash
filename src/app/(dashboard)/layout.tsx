'use client';

import { useTenant } from '@/contexts/TenantContext';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import StoreSwitcher from '@/components/StoreSwitcher';

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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <nav className="flex items-center space-x-3">
              <Link href="/dashboard" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname === '/dashboard' ? 'bg-muted' : ''}`}>
                Dashboard
              </Link>
              <Link href="/clients" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname === '/clients' ? 'bg-muted' : ''}`}>
                Clients
              </Link>

              <Link href="/products" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname === '/products' ? 'bg-muted' : ''}`}>
                Products
              </Link>

              <Link href="/invoices" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname === '/invoices' ? 'bg-muted' : ''}`}>
                Invoices
              </Link>

              <Link href="/quotes" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname === '/quotes' ? 'bg-muted' : ''}`}>
                Quotes
              </Link>

              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname === '/settings' || pathname === '/stores' || pathname === '/reports' ? 'bg-muted' : ''}`}>
                    Settings
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/settings">General Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/stores">Stores</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/reports">Reports</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/transfers">Transfers</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            <div className="flex items-center space-x-2">
              <StoreSwitcher />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{user?.name || 'User'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 focus:text-red-600"
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

      <main className="p-6">
        {children}
      </main>
    </div>
  )
}