export default function BillDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display text-brand">Bill #{params.id}</h1>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
        Receipt Details Placeholder
      </div>
    </div>
  );
}
