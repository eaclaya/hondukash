import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              {session.isAuthenticated && (
                <nav className="flex space-x-4">
                  <Link href="/admin" className="text-sm hover:text-blue-600">Dashboard</Link>
                  <Link href="/admin/tenants" className="text-sm hover:text-blue-600">Tenants</Link>
                  <Link href="/admin/setup" className="text-sm hover:text-blue-600">Setup</Link>
                </nav>
              )}
            </div>
            {session.isAuthenticated && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {session.user?.email}
                </span>
                <Button variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}