'use client';

import { useTranslations } from '@/contexts/LocaleContext';

export default function TenantDashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{t('totalSales')}</h3>
          <p className="text-3xl font-bold">L 0.00</p>
          <p className="text-sm text-muted-foreground">{t('thisMonth')}</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{t('pendingInvoices')}</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{t('lowStockItems')}</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{t('activeClients')}</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{t('recentActivities')}</h3>
          <p className="text-muted-foreground">{t('noRecentActivities')}</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{t('quickActions')}</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 border rounded hover:bg-muted">{t('createInvoice')}</button>
            <button className="w-full text-left px-3 py-2 border rounded hover:bg-muted">{t('addProduct')}</button>
            <button className="w-full text-left px-3 py-2 border rounded hover:bg-muted">{t('registerClient')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}