export default function FoodDrinksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display">Menu Management</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {['Burgers', 'Seafood', 'Sushi', 'Drinks'].map(cat => (
          <div key={cat} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-brand cursor-pointer">
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
}
