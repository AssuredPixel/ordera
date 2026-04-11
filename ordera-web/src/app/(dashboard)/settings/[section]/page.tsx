export default function SettingsSectionPage({ params }: { params: { section: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display capitalize">{params.section.replace('-', ' ')}</h1>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-4xl">
        Settings form for {params.section} placeholder
      </div>
    </div>
  );
}
