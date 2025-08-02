'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTenant } from '@/contexts/TenantContext';
import { Building, Mail, Phone, MapPin } from 'lucide-react';

interface TenantProfile {
  name: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  plan: string;
  fee?: number;
}

export default function TenantProfilePage() {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TenantProfile>({
    name: '',
    contactName: '',
    contactEmail: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    plan: '',
    fee: 0
  });

  useEffect(() => {
    if (tenant) {
      const meta = tenant.meta ? JSON.parse(tenant.meta) : {};
      setProfile({
        name: tenant.name,
        contactName: meta.contact_name || '',
        contactEmail: meta.contact_email || '',
        phone: meta.phone || '',
        address: meta.address || '',
        city: meta.city || '',
        country: meta.country || 'Honduras',
        plan: meta.plan || '',
        fee: meta.fee || 0
      });
    }
  }, [tenant]);

  const handleInputChange = (field: keyof TenantProfile, value: string | number) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/tenant/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        // Show success message
        alert('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!tenant) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading tenant information...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organization Profile</h1>
          <p className="text-slate-600">Manage your organization's information and settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Organization Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Current Plan</Label>
                <Input
                  id="plan"
                  value={profile.plan}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Contact support to change your plan</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={tenant.domain}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Domain cannot be changed</p>
              </div>

              {profile.fee !== undefined && profile.fee > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="fee">Monthly Fee</Label>
                  <Input
                    id="fee"
                    value={`L ${profile.fee.toFixed(2)}`}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={profile.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={profile.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+504 1234-5678"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Address Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Textarea
                  id="address"
                  value={profile.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="e.g., Tegucigalpa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Honduras"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={saving} className="btn-primary-modern">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}