export default function TenantDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
          <p className="text-3xl font-bold">L 0.00</p>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Pending Invoices</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Low Stock Items</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Active Clients</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          <p className="text-muted-foreground">No recent activities</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 border rounded hover:bg-muted">Create Invoice</button>
            <button className="w-full text-left px-3 py-2 border rounded hover:bg-muted">Add Product</button>
            <button className="w-full text-left px-3 py-2 border rounded hover:bg-muted">Register Client</button>
          </div>
        </div>
      </div>
    </div>
  )
}