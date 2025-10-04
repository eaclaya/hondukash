'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Search, Eye, Users, Building, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier } from '@/lib/types/accounting';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    supplierType: 'company' as const,
    contactName: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'Honduras',
    postalCode: '',
    taxId: '',
    registrationNumber: '',
    paymentTerms: 30,
    creditLimit: 0,
    notes: ''
  });

  const supplierTypes = [
    { value: 'individual', label: 'Individual', icon: Users },
    { value: 'company', label: 'Company', icon: Building }
  ];

  const countries = [
    'Honduras', 'Guatemala', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 
    'United States', 'Mexico', 'Canada', 'Other'
  ];

  const paymentTermsOptions = [
    { value: 0, label: 'Cash on Delivery (COD)' },
    { value: 15, label: 'Net 15 days' },
    { value: 30, label: 'Net 30 days' },
    { value: 45, label: 'Net 45 days' },
    { value: 60, label: 'Net 60 days' },
    { value: 90, label: 'Net 90 days' }
  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Mock data
      setSuppliers([
        {
          id: 1,
          storeId: 1,
          name: 'Distribuidora San Jorge',
          supplierType: 'company',
          contactName: 'Carlos Mendoza',
          email: 'carlos@sanjorge.hn',
          phone: '+504 2234-5678',
          mobile: '+504 9876-5432',
          website: 'www.sanjorge.hn',
          address: 'Col. Palmira, 3ra Calle',
          city: 'Tegucigalpa',
          state: 'Francisco Morazán',
          country: 'Honduras',
          postalCode: '11101',
          taxId: '08011234567890',
          registrationNumber: 'RTN-08011234567890',
          paymentTerms: 30,
          creditLimit: 100000,
          isActive: true,
          notes: 'Primary supplier for office supplies and equipment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          storeId: 1,
          name: 'Tech Solutions Honduras',
          supplierType: 'company',
          contactName: 'Ana Rodriguez',
          email: 'ana@techsolutions.hn',
          phone: '+504 2567-8910',
          address: 'Blvd. Morazán, Plaza Crisp',
          city: 'Tegucigalpa',
          state: 'Francisco Morazán',
          country: 'Honduras',
          paymentTerms: 15,
          creditLimit: 50000,
          isActive: true,
          notes: 'IT equipment and software supplier',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          storeId: 1,
          name: 'Juan Perez',
          supplierType: 'individual',
          email: 'juan.perez@email.com',
          phone: '+504 3456-7890',
          address: 'Barrio La Granja',
          city: 'San Pedro Sula',
          state: 'Cortés',
          country: 'Honduras',
          paymentTerms: 0,
          creditLimit: 10000,
          isActive: true,
          notes: 'Freelance maintenance services',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    try {
      if (!formData.name) {
        toast.error('Supplier name is required');
        return;
      }

      // TODO: Replace with actual API call
      console.log('Creating supplier:', formData);
      toast.success('Supplier created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error('Failed to create supplier');
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      supplierType: supplier.supplierType,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      mobile: supplier.mobile || '',
      website: supplier.website || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country,
      postalCode: supplier.postalCode || '',
      taxId: supplier.taxId || '',
      registrationNumber: supplier.registrationNumber || '',
      paymentTerms: supplier.paymentTerms,
      creditLimit: supplier.creditLimit,
      notes: supplier.notes || ''
    });
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      supplierType: 'company',
      contactName: '',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: 'Honduras',
      postalCode: '',
      taxId: '',
      registrationNumber: '',
      paymentTerms: 30,
      creditLimit: 0,
      notes: ''
    });
    setEditingSupplier(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const getSupplierTypeColor = (type: string) => {
    const colors = {
      individual: 'bg-blue-100 text-blue-800',
      company: 'bg-green-100 text-green-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSupplierTypeIcon = (type: string) => {
    const typeConfig = supplierTypes.find(t => t.value === type);
    const IconComponent = typeConfig?.icon || Building;
    return <IconComponent className="h-4 w-4" />;
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (supplier.contactName && supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || supplier.supplierType === filterType;
    return matchesSearch && matchesType;
  });

  const totalCreditLimit = suppliers.reduce((sum, supplier) => sum + supplier.creditLimit, 0);
  const activeSuppliers = suppliers.filter(s => s.isActive).length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-slate-600">Manage your suppliers and vendors</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Create New Supplier'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Supplier Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Company or individual name"
                  />
                </div>
                <div>
                  <Label htmlFor="supplierType">Supplier Type</Label>
                  <Select 
                    value={formData.supplierType} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, supplierType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <type.icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Primary contact person"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@supplier.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+504 2234-5678"
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="+504 9876-5432"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="www.supplier.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Department</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="11101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    placeholder="Tax identification number"
                  />
                </div>
                <div>
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    placeholder="Business registration number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select 
                    value={formData.paymentTerms.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTermsOptions.map(term => (
                        <SelectItem key={term.value} value={term.value.toString()}>
                          {term.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <NumericInput
                    id="creditLimit"
                    value={formData.creditLimit.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, creditLimit: value || 0 }))}
                    placeholder="0.00"
                    allowDecimals={true}
                    maxDecimals={4}
                    allowNegative={false}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this supplier"
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSupplier}>
                  {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Suppliers</p>
                <p className="text-2xl font-bold">{activeSuppliers}</p>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Credit Limit</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCreditLimit)}</p>
              </div>
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {supplierTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading suppliers...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getSupplierTypeIcon(supplier.supplierType)}
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <Badge className={getSupplierTypeColor(supplier.supplierType)} variant="secondary">
                            {supplier.supplierType}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {supplier.contactName && <div className="font-medium">{supplier.contactName}</div>}
                        {supplier.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {supplier.city && supplier.state && (
                          <div>{supplier.city}, {supplier.state}</div>
                        )}
                        <div className="text-gray-600">{supplier.country}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.paymentTerms === 0 ? 'COD' : `Net ${supplier.paymentTerms} days`}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(supplier.creditLimit)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditSupplier(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}