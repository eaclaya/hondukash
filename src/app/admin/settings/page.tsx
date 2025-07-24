export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>
      <div className="space-y-4">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Global Configuration</h3>
          <p className="text-muted-foreground">
            System settings will be implemented here
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Plan Management</h3>
          <p className="text-muted-foreground">
            Subscription plans configuration will be implemented here
          </p>
        </div>
      </div>
    </div>
  )
}