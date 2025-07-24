import { TrendingUp, TrendingDown, DollarSign, FileText, Package, Users, AlertTriangle, Clock } from 'lucide-react'
export default function TenantDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Last updated</p>
          <p className="text-sm font-medium text-slate-900">{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="metric-change-positive">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12.5%
            </div>
          </div>
          <div className="metric-label">Total Sales</div>
          <div className="metric-value">L 45,230</div>
          <p className="text-xs text-slate-500">This month</p>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="metric-change-positive">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8.2%
            </div>
          </div>
          <div className="metric-label">Pending Invoices</div>
          <div className="metric-value">23</div>
          <p className="text-xs text-slate-500">Worth L 12,450</p>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="metric-change-negative">
              <TrendingDown className="h-4 w-4 mr-1" />
              -3.1%
            </div>
          </div>
          <div className="metric-label">Low Stock Items</div>
          <div className="metric-value">8</div>
          <p className="text-xs text-slate-500">Requires attention</p>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="metric-change-positive">
              <TrendingUp className="h-4 w-4 mr-1" />
              +5.7%
            </div>
          </div>
          <div className="metric-label">Active Clients</div>
          <div className="metric-value">156</div>
          <p className="text-xs text-slate-500">This month</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Recent Activities</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Invoice #INV-001 created</p>
                  <p className="text-xs text-slate-500">Client: Acme Corp - L 2,450</p>
                </div>
                <div className="text-xs text-slate-400 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  2 hours ago
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Product "Laptop HP" updated</p>
                  <p className="text-xs text-slate-500">Stock: 15 units available</p>
                </div>
                <div className="text-xs text-slate-400 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  4 hours ago
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">New client registered</p>
                  <p className="text-xs text-slate-500">TechSolutions Ltd</p>
                </div>
                <div className="text-xs text-slate-400 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  6 hours ago
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="card-modern p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-slate-900">Create Invoice</span>
                </div>
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs">+</span>
                </div>
              </button>
              
              <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 group">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-slate-900">Add Product</span>
                </div>
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs">+</span>
                </div>
              </button>
              
              <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-200 group">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-slate-900">Register Client</span>
                </div>
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs">+</span>
                </div>
              </button>
            </div>
          </div>
          
          {/* Alerts */}
          <div className="card-modern p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-900">Low Stock Alert</p>
                  <p className="text-xs text-red-700">8 products need restocking</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Overdue Invoices</p>
                  <p className="text-xs text-yellow-700">3 invoices are overdue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}