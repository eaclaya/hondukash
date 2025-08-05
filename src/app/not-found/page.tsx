import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-white">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-white">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
      </div>
    </div>
  )
}
