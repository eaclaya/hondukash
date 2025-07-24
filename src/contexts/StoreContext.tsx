'use client'

import { createContext, useContext, useState } from 'react'

interface Store {
  id: string
  name: string
  location: string
  isActive: boolean
}

interface StoreContextType {
  currentStore: Store | null
  stores: Store[]
  setCurrentStore: (store: Store) => void
  setStores: (stores: Store[]) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentStore, setCurrentStore] = useState<Store | null>({
    id: '1',
    name: 'Main Store',
    location: 'Tegucigalpa',
    isActive: true
  })
  const [stores, setStores] = useState<Store[]>([
    {
      id: '1',
      name: 'Main Store', 
      location: 'Tegucigalpa',
      isActive: true
    }
  ])

  return (
    <StoreContext.Provider value={{ 
      currentStore, 
      stores, 
      setCurrentStore, 
      setStores 
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