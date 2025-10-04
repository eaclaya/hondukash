'use client';

import { useTenantAuth } from '@/hooks/useTenantAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import StoreSwitcher from '@/components/StoreSwitcher';
import { useStore } from '@/contexts/StoreContext';
import { useTranslations } from '@/contexts/LocaleContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading: authLoading, isAuthenticated, logout } = useTenantAuth();
  const { currentStore } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations('navigation');
  const tAuth = useTranslations('auth');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{tAuth('pleaseSignIn')}</div>
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
                {tNav('dashboard')}
              </Link>
              <Link href="/clients" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname === '/clients' ? 'bg-muted' : ''}`}>
                {tNav('clients')}
              </Link>

              <Link href="/products" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname === '/products' ? 'bg-muted' : ''}`}>
                {tNav('products')}
              </Link>

              <Link href="/invoices" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname === '/invoices' ? 'bg-muted' : ''}`}>
                {tNav('invoices')}
              </Link>

              <Link href="/quotes" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname === '/quotes' ? 'bg-muted' : ''}`}>
                {tNav('quotes')}
              </Link>

              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${pathname.startsWith('/stores/') && pathname.includes('/edit') || pathname === '/tax-rates' || pathname === '/stores' || pathname === '/reports' || pathname === '/transfers' ? 'bg-muted' : ''}`}>
                    {tNav('settings')}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {currentStore && (
                    <DropdownMenuItem asChild>
                      <Link href={`/stores/${currentStore.id}/edit`}>{tNav('settings')}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/tax-rates">{tNav('taxRates')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tags">{tNav('tags')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing-rules">{tNav('pricingRules')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/stores">{tNav('allStores')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/reports">{tNav('reports')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/transfers">{tNav('transfers')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Accounting</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/accounting/chart-of-accounts">Chart of Accounts</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/accounting/journal-entries">Journal Entries</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/accounting/bank-accounts">Bank Accounts</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/accounting/suppliers">Suppliers</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/accounting/bills">Bills & Payments</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/accounting/reports">Financial Reports</Link>
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
                    {tNav('settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {tAuth('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 flex flex-col">
        {children}
      </main>
    </div>
  )
}