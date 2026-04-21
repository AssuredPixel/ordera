'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User as UserIcon, 
  Settings, 
  Save, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin,
  Upload,
  Palette,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'organization' | 'profile'>('organization');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [orgData, setOrgData] = useState<any>({
    name: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    primaryColor: '#7C3AED',
    socialLinks: {
      instagram: '',
      facebook: '',
      twitter: '',
      linkedin: ''
    }
  });

  const [profileData, setProfileData] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    avatarUrl: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data: any = await api.get('/api/owner/settings');
      setOrgData(data.organization);
      setProfileData(data.profile);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/api/owner/settings/organization', orgData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert('Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/api/owner/settings/profile', profileData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert('Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your professional profile and restaurant branding</p>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-2xl w-full max-w-md">
        <button
          onClick={() => setActiveTab('organization')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'organization' 
            ? 'bg-white text-purple-600 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Organization
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'profile' 
            ? 'bg-white text-purple-600 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Personal Profile
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {activeTab === 'organization' ? (
          <form onSubmit={handleOrgSubmit} className="divide-y divide-slate-100">
            <div className="p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-500" />
                    Base Configuration
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Restaurant Name</label>
                      <input 
                        value={orgData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData({...orgData, name: e.target.value})}
                        className="w-full bg-slate-50 p-4 border rounded-xl border-transparent focus:bg-white focus:border-purple-200 outline-none transition-all"
                        placeholder="e.g. Mama Put Express"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Official Tagline / Slogan</label>
                      <input 
                        value={orgData.tagline || ''}
                        onChange={e => setOrgData({...orgData, tagline: e.target.value})}
                        className="w-full bg-slate-50 p-4 border rounded-xl border-transparent focus:bg-white focus:border-purple-200 outline-none transition-all"
                        placeholder="Always Fresh, Always Hot"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-pink-500" />
                    Visual Branding
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200 group relative cursor-pointer">
                        {orgData.logoUrl ? (
                          <img src={orgData.logoUrl} className="w-full h-full object-contain rounded-2xl" alt="Logo" />
                        ) : (
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-purple-500 transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-slate-900">Brand Logo</p>
                        <p className="text-xs text-slate-500">SVG, PNG or JPG. Max 2MB.</p>
                        <button type="button" className="text-purple-600 hover:text-purple-700 text-xs font-bold transition-colors">
                          Upload New
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Primary Brand Color</label>
                      <div className="flex gap-3">
                        <input 
                          type="color" 
                          value={orgData.primaryColor}
                          onChange={e => setOrgData({...orgData, primaryColor: e.target.value})}
                          className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden shadow-sm"
                        />
                        <input 
                          value={orgData.primaryColor}
                          onChange={e => setOrgData({...orgData, primaryColor: e.target.value})}
                          className="w-full bg-slate-50 px-4 py-2 border rounded-xl border-transparent focus:bg-white uppercase font-mono tracking-wider"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-500" />
                    Contact & HQ Location
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Business Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          value={orgData.contactEmail}
                          onChange={e => setOrgData({...orgData, contactEmail: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">HQ Physical Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          value={orgData.address}
                          onChange={e => setOrgData({...orgData, address: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-green-500" />
                    Social Presence
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Instagram</label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                        <input 
                          value={orgData.socialLinks.instagram}
                          onChange={e => setOrgData({
                            ...orgData, 
                            socialLinks: {...orgData.socialLinks, instagram: e.target.value}
                          })}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facebook</label>
                      <div className="relative">
                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                        <input 
                          value={orgData.socialLinks.facebook}
                          onChange={e => setOrgData({
                            ...orgData, 
                            socialLinks: {...orgData.socialLinks, facebook: e.target.value}
                          })}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Changes affect your platform branding and public invoices.
              </p>
              <button 
                type="submit" 
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px] px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="divide-y divide-slate-100">
            <div className="p-6 md:p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner">
                    {profileData.avatarUrl ? (
                      <img src={profileData.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-300">
                        {profileData.firstName[0]}
                      </div>
                    )}
                  </div>
                  <button className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-purple-600 hover:text-purple-700 transition-all hover:scale-110">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">First Name</label>
                    <input 
                      value={profileData.firstName}
                      onChange={e => setProfileData({...profileData, firstName: e.target.value})}
                      className="w-full bg-slate-50 p-4 border rounded-xl border-transparent focus:bg-white focus:border-purple-200 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Last Name</label>
                    <input 
                      value={profileData.lastName}
                      onChange={e => setProfileData({...profileData, lastName: e.target.value})}
                      className="w-full bg-slate-50 p-4 border rounded-xl border-transparent focus:bg-white focus:border-purple-200 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-full space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <input 
                      value={profileData.email}
                      disabled
                      className="w-full bg-slate-100 p-4 rounded-xl text-slate-500 border-none cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400">Email addresses cannot be changed directly.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Updating your profile helps staff identify you.
              </p>
              <button 
                type="submit" 
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px] px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </button>
            </div>
          </form>
        )}
      </div>

      {success && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <div className="font-semibold text-sm">Settings updated successfully!</div>
          </div>
        </div>
      )}
    </div>
  );
}
