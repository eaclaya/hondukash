'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { Store } from '@/lib/types'

interface StoreContextType {
  currentStore: Store | null
  stores: Store[]
  setCurrentStore: (store: Store) => void
  setStores: (stores: Store[]) => void
  refreshCurrentStore: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentStore, setCurrentStore] = useState<Store | null>(null)
  const [stores, setStores] = useState<Store[]>([])

  // Function to refresh current store data from API
  const refreshCurrentStore = async () => {
    if (!currentStore) return
    
    try {
      const response = await fetch(`/api/stores/${currentStore.id}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentStore(data.store)
      }
    } catch (error) {
      console.error('Error refreshing store:', error)
    }
  }

  // Load stores on mount
  useEffect(() => {
    const loadStores = async () => {
      try {
        const response = await fetch('/api/stores')
        if (response.ok) {
          const data = await response.json()
          const storesList = data.data?.data || []
          setStores(storesList)
          
          // Set first store as current if none selected
          if (storesList.length > 0 && !currentStore) {
            setCurrentStore(storesList[0])
          }
        }
      } catch (error) {
        console.error('Error loading stores:', error)
        // Fallback to default store for development
        const defaultStore: Store = {
          id: 1,
          name: 'Main Store',
          location: 'Tegucigalpa',
          country: 'Honduras',
          currency: 'HNL',
          language: 'es',
          taxRate: 0.15,
          invoicePrefix: 'INV',
          invoiceCounter: 1,
          quotePrefix: 'QUO',
          quoteCounter: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setCurrentStore(defaultStore)
        setStores([defaultStore])
      }
    }
    
    loadStores()
  }, [])

  return (
    <StoreContext.Provider value={{ 
      currentStore, 
      stores, 
      setCurrentStore, 
      setStores,
      refreshCurrentStore
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}