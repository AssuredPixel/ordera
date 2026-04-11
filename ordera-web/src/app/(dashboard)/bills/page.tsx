export default function BillsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display">Bills & Payments</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-4 text-gray-400 italic" colSpan={4}>Loading transactions...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
