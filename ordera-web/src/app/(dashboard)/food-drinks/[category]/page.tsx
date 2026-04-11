export default function CategoryPage({ params }: { params: { category: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display capitalize">{params.category} Items</h1>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        Menu Items List Placeholder
      </div>
    </div>
  );
}
