'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Search, Eye, CreditCard, Banknote, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { BankAccount, ChartOfAccount } from '@/lib/types/accounting';

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    accountType: 'checking' as const,
    routingNumber: '',
    swiftCode: '',
    iban: '',
    currency: 'HNL',
    branchName: '',
    branchAddress: '',
    contactPerson: '',
    contactPhone: '',
    description: '',
    notes: '',
    isDefault: false,
    chartAccountId: 0
  });

  const accountTypes = [
    { value: 'checking', label: 'Checking Account', icon: CreditCard },
    { value: 'savings', label: 'Savings Account', icon: DollarSign },
    { value: 'money_market', label: 'Money Market', icon: DollarSign },
    { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'petty_cash', label: 'Petty Cash', icon: Banknote }
  ];

  useEffect(() => {
    fetchAccounts();
    fetchChartOfAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenant/bank-accounts');

      if (response.ok) {
        const accounts = await response.json();
        setAccounts(accounts);
      } else {
        console.error('Failed to fetch bank accounts:', response.statusText);
        toast.error('Failed to fetch bank accounts');
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Failed to fetch bank accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartOfAccounts = async () => {
    try {
      // Fetch asset accounts that are suitable for bank accounts
      const response = await fetch('/api/tenant/chart-of-accounts?accountType=asset&activeOnly=true');

      if (response.ok) {
        const allAccounts = await response.json();
        // Filter to include cash and current asset accounts that would be suitable for bank accounts
        const bankSuitableAccounts = allAccounts.filter((account: any) => 
          account.accountSubType === 'cash' || 
          account.accountSubType === 'current_asset' ||
          account.accountName.toLowerCase().includes('cash') ||
          account.accountName.toLowerCase().includes('bank')
        );
        setChartOfAccounts(bankSuitableAccounts);
      } else {
        console.error('Failed to fetch chart of accounts:', response.statusText);
        setChartOfAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      setChartOfAccounts([]);
    }
  };

  const handleCreateAccount = async () => {
    try {
      if (!formData.accountName || !formData.bankName || !formData.accountNumber) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.chartAccountId === 0) {
        toast.error('Please select a chart of accounts');
        return;
      }

      const response = await fetch('/api/tenant/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Bank account created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchAccounts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to create bank account');
      }
    } catch (error) {
      console.error('Error creating bank account:', error);
      toast.error('Failed to create bank account');
    }
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      accountName: account.accountName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      routingNumber: account.routingNumber || '',
      swiftCode: account.swiftCode || '',
      iban: account.iban || '',
      currency: account.currency,
      branchName: account.branchName || '',
      branchAddress: account.branchAddress || '',
      contactPerson: account.contactPerson || '',
      contactPhone: account.contactPhone || '',
      description: account.description || '',
      notes: account.notes || '',
      isDefault: account.isDefault,
      chartAccountId: account.chartAccountId
    });
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      accountName: '',
      bankName: '',
      accountNumber: '',
      accountType: 'checking',
      routingNumber: '',
      swiftCode: '',
      iban: '',
      currency: 'HNL',
      branchName: '',
      branchAddress: '',
      contactPerson: '',
      contactPhone: '',
      description: '',
      notes: '',
      isDefault: false,
      chartAccountId: 0
    });
    setEditingAccount(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      checking: 'bg-blue-100 text-blue-800',
      savings: 'bg-green-100 text-green-800',
      money_market: 'bg-purple-100 text-purple-800',
      credit_card: 'bg-red-100 text-red-800',
      cash: 'bg-orange-100 text-orange-800',
      petty_cash: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAccountTypeIcon = (type: string) => {
    const typeConfig = accountTypes.find((t) => t.value === type);
    const IconComponent = typeConfig?.icon || CreditCard;
    return <IconComponent className="h-4 w-4" />;
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber.includes(searchTerm);
    const matchesType = filterType === 'all' || account.accountType === filterType;
    return matchesSearch && matchesType;
  });

  const totalBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bank Accounts</h1>
          <p className="text-slate-600">Manage your bank accounts and cash accounts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Edit Bank Account' : 'Create New Bank Account'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, accountName: e.target.value }))}
                    placeholder="e.g., Main Checking Account"
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input id="bankName" value={formData.bankName} onChange={(e) => setFormData((prev) => ({ ...prev, bankName: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select value={formData.accountType} onValueChange={(value: any) => setFormData((prev) => ({ ...prev, accountType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypes.map((type) => (
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

              <div>
                <Label htmlFor="chartAccountId">Chart of Accounts *</Label>
                {chartOfAccounts.length === 0 ? (
                  <div className="space-y-2">
                    <div className="p-3 border border-orange-200 bg-orange-50 rounded-md">
                      <p className="text-sm text-orange-800">
                        No suitable accounts found in your chart of accounts.
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Please create an asset account with sub-type "Cash" or "Current Asset" first.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open('/accounting/chart-of-accounts', '_blank')}
                      className="w-full"
                    >
                      Go to Chart of Accounts
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={formData.chartAccountId.toString()}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, chartAccountId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account from chart of accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      {chartOfAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.accountCode} - {account.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={formData.routingNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, routingNumber: e.target.value }))}
                    placeholder="Routing number"
                  />
                </div>
                <div>
                  <Label htmlFor="swiftCode">SWIFT Code</Label>
                  <Input
                    id="swiftCode"
                    value={formData.swiftCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, swiftCode: e.target.value }))}
                    placeholder="SWIFT code"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HNL">HNL - Honduran Lempira</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={formData.branchName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, branchName: e.target.value }))}
                    placeholder="Branch name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="Account manager name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="branchAddress">Branch Address</Label>
                <Input
                  id="branchAddress"
                  value={formData.branchAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, branchAddress: e.target.value }))}
                  placeholder="Branch address"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Account description"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isDefault">Set as default account</Label>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAccount}
                  disabled={chartOfAccounts.length === 0}
                >
                  {editingAccount ? 'Update Account' : 'Create Account'}
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
                <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
                <p className="text-2xl font-bold">{accounts.filter((a) => a.isActive).length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Banks Connected</p>
                <p className="text-2xl font-bold">{new Set(accounts.map((a) => a.bankName)).size}</p>
              </div>
              <Banknote className="h-8 w-8 text-purple-600" />
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
                <Input placeholder="Search bank accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bank Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading bank accounts...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {getAccountTypeIcon(account.accountType)}
                        <div>
                          <div>{account.accountName}</div>
                          {account.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{account.bankName}</TableCell>
                    <TableCell className="font-mono">{account.accountNumber}</TableCell>
                    <TableCell>
                      <Badge className={getAccountTypeColor(account.accountType)}>{account.accountType.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{formatCurrency(account.currentBalance)}</TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? 'default' : 'secondary'}>{account.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditAccount(account)}>
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
