'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Percent } from 'lucide-react';
import { TaxRate, CreateTaxRateRequest, UpdateTaxRateRequest } from '@/lib/services/taxRateService';
import { useAuth } from '@/contexts/AuthContext';

export default function TaxRatesPage() {
  const { getAuthHeaders } = useAuth();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null);
  const [formData, setFormData] = useState<CreateTaxRateRequest & { ratePercent: number }>({
    name: '',
    code: '',
    rate: 0,
    ratePercent: 0,
    type: 'sales',
    isDefault: false,
    description: ''
  });

  useEffect(() => {
    loadTaxRates();
  }, []);

  const loadTaxRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenant/tax-rates', {
        headers: await getAuthHeaders()
      });

      if (response.ok) {
        const taxRatesData = await response.json();
        setTaxRates(taxRatesData);
      } else {
        console.error('Failed to fetch tax rates:', response.statusText);
      }
    } catch (error: unknown) {
      console.error('Error loading tax rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert percentage to decimal before submitting
      const submitData = {
        name: formData.name,
        code: formData.code,
        rate: formData.ratePercent / 100,
        type: formData.type,
        isDefault: formData.isDefault,
        description: formData.description
      };

      if (editingTaxRate) {
        const response = await fetch(`/api/tenant/tax-rates/${editingTaxRate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(await getAuthHeaders())
          },
          body: JSON.stringify(submitData)
        });

        if (response.ok) {
          await loadTaxRates();
          resetForm();
        } else {
          console.error('Failed to update tax rate:', response.statusText);
        }
      } else {
        const response = await fetch('/api/tenant/tax-rates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(await getAuthHeaders())
          },
          body: JSON.stringify(submitData)
        });

        if (response.ok) {
          await loadTaxRates();
          resetForm();
        } else {
          console.error('Failed to create tax rate:', response.statusText);
        }
      }
    } catch (error: unknown) {
      console.error('Error saving tax rate:', error);
    }
  };

  const handleEdit = (taxRate: TaxRate) => {
    setEditingTaxRate(taxRate);
    setFormData({
      name: taxRate.name,
      code: taxRate.code,
      rate: taxRate.rate,
      ratePercent: taxRate.rate * 100,
      type: taxRate.type,
      isDefault: taxRate.isDefault,
      description: taxRate.description || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (taxRateId: number) => {
    if (!confirm('Are you sure you want to delete this tax rate?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tenant/tax-rates/${taxRateId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
      });

      if (response.ok) {
        await loadTaxRates();
      } else {
        console.error('Failed to delete tax rate:', response.statusText);
      }
    } catch (error: unknown) {
      console.error('Error deleting tax rate:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      rate: 0,
      ratePercent: 0,
      type: 'sales',
      isDefault: false,
      description: ''
    });
    setEditingTaxRate(null);
    setDialogOpen(false);
  };

  const formatRate = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tax Rates</h1>
          <p className="text-slate-600">Manage tax rates for your organization</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="btn-primary-modern">
              <Plus className="h-4 w-4 mr-2" />
              Add Tax Rate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTaxRate ? 'Edit Tax Rate' : 'Create New Tax Rate'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Sales Tax"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., ISV"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Rate (%) *</Label>
                <NumericInput
                  id="rate"
                  value={formData.ratePercent.toString()}
                  onValueChange={(value) => handleInputChange('ratePercent', value || 0)}
                  placeholder="15.00"
                  allowDecimals={true}
                  maxDecimals={2}
                  allowNegative={false}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Tax</SelectItem>
                    <SelectItem value="purchase">Purchase Tax</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="isDefault">Set as default tax rate</Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary-modern">
                  {editingTaxRate ? 'Update' : 'Create'} Tax Rate
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading tax rates...</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {taxRates.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-slate-600">
                  <Percent className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p>No tax rates configured yet.</p>
                  <p className="text-sm">Create your first tax rate to get started.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            taxRates.map((taxRate) => (
              <Card key={taxRate.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-900">{taxRate.name}</h3>
                        <Badge variant="secondary">{taxRate.code}</Badge>
                        <Badge variant="outline">{taxRate.type}</Badge>
                        {taxRate.isDefault && (
                          <Badge className="bg-green-100 text-green-800">Default</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-slate-600">
                        <span className="font-medium text-lg text-slate-900">
                          {formatRate(taxRate.rate)}
                        </span>
                        {taxRate.description && (
                          <span>{taxRate.description}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(taxRate)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(taxRate.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}