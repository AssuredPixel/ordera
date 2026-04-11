export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display">Business Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">Revenue Card</div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">Orders Card</div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">Customers Card</div>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 h-96">
        Sales Chart Placeholder
      </div>
    </div>
  );
}
