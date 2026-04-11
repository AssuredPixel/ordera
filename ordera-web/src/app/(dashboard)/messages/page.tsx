export default function MessagesPage() {
  return (
    <div className="h-full flex flex-col space-y-6">
      <h1 className="text-3xl font-display">Team Messaging</h1>
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden">
        <aside className="w-80 border-r border-gray-100">Thread List</aside>
        <main className="flex-1">Chat Window</main>
      </div>
    </div>
  );
}
