export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display">Branch Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer">Profile Settings</div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer">Hardware & Receipt</div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer">Security</div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer">Notification Prefs</div>
      </div>
    </div>
  );
}
