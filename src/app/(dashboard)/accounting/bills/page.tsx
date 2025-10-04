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
import { Plus, Edit, Trash2, Search, Eye, FileText, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Bill, BillItem, BillPayment, Supplier, ChartOfAccount } from '@/lib/types/accounting';
import { processBillPayment } from '@/lib/services/accountingPaymentService';

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Form state for creating bills
  const [billFormData, setBillFormData] = useState({
    supplierId: 0,
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    supplierInvoiceNumber: '',
    notes: '',
    terms: '',
    items: [
      { description: '', quantity: 1, unitCost: 0, accountId: 0 }
    ]
  });

  // Payment form state
  const [paymentFormData, setPaymentFormData] = useState({
    billId: 0,
    bankAccountId: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'bank_transfer' as const,
    referenceNumber: '',
    notes: ''
  });

  const billStatuses = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800' },
    { value: 'partial', label: 'Partially Paid', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'electronic', label: 'Electronic Payment' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchBills();
    fetchSuppliers();
    fetchChartOfAccounts();
    fetchBankAccounts();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Mock data
      setBills([
        {
          id: 1,
          storeId: 1,
          supplierId: 1,
          billNumber: 'BILL-001',
          supplierInvoiceNumber: 'INV-2024-001',
          billDate: '2024-01-15',
          dueDate: '2024-02-14',
          subtotal: 5000,
          taxAmount: 750,
          totalAmount: 5750,
          paidAmount: 0,
          status: 'open',
          notes: 'Office supplies for Q1',
          items: [
            {
              id: 1,
              billId: 1,
              description: 'Office Supplies',
              quantity: 1,
              unitCost: 5000,
              lineTotal: 5000,
              accountId: 1,
              sortOrder: 1,
              createdAt: new Date().toISOString()
            }
          ],
          payments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          storeId: 1,
          supplierId: 2,
          billNumber: 'BILL-002',
          supplierInvoiceNumber: 'TS-2024-005',
          billDate: '2024-01-20',
          dueDate: '2024-02-04',
          subtotal: 15000,
          taxAmount: 2250,
          totalAmount: 17250,
          paidAmount: 8625,
          status: 'partial',
          notes: 'IT equipment purchase',
          items: [
            {
              id: 2,
              billId: 2,
              description: 'Laptop computers',
              quantity: 2,
              unitCost: 7500,
              lineTotal: 15000,
              accountId: 2,
              sortOrder: 1,
              createdAt: new Date().toISOString()
            }
          ],
          payments: [
            {
              id: 1,
              billId: 2,
              bankAccountId: 1,
              paymentNumber: 'PAY-001',
              paymentDate: '2024-01-25',
              amount: 8625,
              paymentMethod: 'bank_transfer',
              status: 'cleared',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      // TODO: Replace with actual API call
      setSuppliers([
        { id: 1, storeId: 1, name: 'Distribuidora San Jorge', supplierType: 'company', country: 'Honduras', paymentTerms: 30, creditLimit: 100000, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 2, storeId: 1, name: 'Tech Solutions Honduras', supplierType: 'company', country: 'Honduras', paymentTerms: 15, creditLimit: 50000, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchChartOfAccounts = async () => {
    try {
      // TODO: Replace with actual API call
      setChartOfAccounts([
        { id: 1, storeId: 1, accountCode: '6100', accountName: 'Office Supplies', accountType: 'expense', accountSubType: 'operating_expense', normalBalance: 'debit', isSystemAccount: false, isControlAccount: false, isActive: true, currentBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 2, storeId: 1, accountCode: '6200', accountName: 'Equipment', accountType: 'expense', accountSubType: 'operating_expense', normalBalance: 'debit', isSystemAccount: false, isControlAccount: false, isActive: true, currentBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 3, storeId: 1, accountCode: '6300', accountName: 'Professional Services', accountType: 'expense', accountSubType: 'operating_expense', normalBalance: 'debit', isSystemAccount: false, isControlAccount: false, isActive: true, currentBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]);
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/tenant/bank-accounts');
      
      if (response.ok) {
        const accounts = await response.json();
        setBankAccounts(accounts);
      } else {
        console.error('Failed to fetch bank accounts:', response.statusText);
        // Fallback to empty array if API fails
        setBankAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      // Fallback to empty array if network error
      setBankAccounts([]);
    }
  };

  const addBillItem = () => {
    setBillFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitCost: 0, accountId: 0 }]
    }));
  };

  const updateBillItem = (index: number, field: string, value: any) => {
    setBillFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeBillItem = (index: number) => {
    if (billFormData.items.length > 1) {
      setBillFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateBillTotals = () => {
    const subtotal = billFormData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const taxAmount = subtotal * 0.15; // 15% tax
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  const handleCreateBill = async () => {
    try {
      if (billFormData.supplierId === 0) {
        toast.error('Please select a supplier');
        return;
      }

      if (billFormData.items.some(item => !item.description || item.accountId === 0)) {
        toast.error('Please fill in all item details');
        return;
      }

      // TODO: Replace with actual API call
      console.log('Creating bill:', billFormData);
      toast.success('Bill created successfully');
      setIsCreateDialogOpen(false);
      resetBillForm();
      fetchBills();
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    }
  };

  const handleCreatePayment = async () => {
    try {
      if (!selectedBill || paymentFormData.amount <= 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }

      const remainingAmount = selectedBill.totalAmount - selectedBill.paidAmount;
      if (paymentFormData.amount > remainingAmount) {
        toast.error(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingAmount)}`);
        return;
      }

      if (paymentFormData.bankAccountId === 0) {
        toast.error('Please select a bank account');
        return;
      }

      // Get domain from current location
      const domain = window.location.hostname;

      // Process payment with automatic journal entry creation
      const result = await processBillPayment(domain, {
        billId: selectedBill.id,
        bankAccountId: paymentFormData.bankAccountId,
        amount: paymentFormData.amount,
        paymentDate: paymentFormData.paymentDate,
        paymentMethod: paymentFormData.paymentMethod,
        referenceNumber: paymentFormData.referenceNumber,
        notes: paymentFormData.notes
      });

      toast.success(`Payment recorded successfully! Journal Entry ${result.journalEntry.entryNumber} created.`);
      setIsPaymentDialogOpen(false);
      resetPaymentForm();
      fetchBills();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(`Failed to record payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetBillForm = () => {
    setBillFormData({
      supplierId: 0,
      billDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      supplierInvoiceNumber: '',
      notes: '',
      terms: '',
      items: [
        { description: '', quantity: 1, unitCost: 0, accountId: 0 }
      ]
    });
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      billId: 0,
      bankAccountId: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'bank_transfer',
      referenceNumber: '',
      notes: ''
    });
    setSelectedBill(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusConfig = billStatuses.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const openPaymentDialog = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentFormData(prev => ({
      ...prev,
      billId: bill.id,
      amount: bill.totalAmount - bill.paidAmount
    }));
    setIsPaymentDialogOpen(true);
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bill.supplierInvoiceNumber && bill.supplierInvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || bill.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const { subtotal, taxAmount, totalAmount } = calculateBillTotals();
  const totalUnpaid = bills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
  const overdueCount = bills.filter(bill => bill.status === 'overdue').length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bills & Payments</h1>
          <p className="text-slate-600">Manage supplier bills and payments</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Bill</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplierId">Supplier *</Label>
                    <Select 
                      value={billFormData.supplierId.toString()} 
                      onValueChange={(value) => setBillFormData(prev => ({ ...prev, supplierId: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="supplierInvoiceNumber">Supplier Invoice #</Label>
                    <Input
                      id="supplierInvoiceNumber"
                      value={billFormData.supplierInvoiceNumber}
                      onChange={(e) => setBillFormData(prev => ({ ...prev, supplierInvoiceNumber: e.target.value }))}
                      placeholder="Supplier's invoice number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billDate">Bill Date</Label>
                    <Input
                      id="billDate"
                      type="date"
                      value={billFormData.billDate}
                      onChange={(e) => setBillFormData(prev => ({ ...prev, billDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={billFormData.dueDate}
                      onChange={(e) => setBillFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Bill Items</Label>
                    <Button type="button" onClick={addBillItem} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {billFormData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Label>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateBillItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Quantity</Label>
                          <NumericInput
                            value={item.quantity.toString()}
                            onValueChange={(value) => updateBillItem(index, 'quantity', value || 1)}
                            placeholder="1"
                            allowDecimals={true}
                            maxDecimals={4}
                            allowNegative={false}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Unit Cost</Label>
                          <NumericInput
                            value={item.unitCost?.toString() || ''}
                            onValueChange={(value) => updateBillItem(index, 'unitCost', value || 0)}
                            placeholder="0.00"
                            allowDecimals={true}
                            maxDecimals={4}
                            allowNegative={false}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label>Account</Label>
                          <Select 
                            value={item.accountId.toString()} 
                            onValueChange={(value) => updateBillItem(index, 'accountId', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {chartOfAccounts.map(account => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.accountCode} - {account.accountName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1">
                          {billFormData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeBillItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong>Subtotal: {formatCurrency(subtotal)}</strong>
                      </div>
                      <div>
                        <strong>Tax (15%): {formatCurrency(taxAmount)}</strong>
                      </div>
                      <div>
                        <strong>Total: {formatCurrency(totalAmount)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={billFormData.notes}
                    onChange={(e) => setBillFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBill}>
                    Create Bill
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
                <p className="text-2xl font-bold">{bills.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unpaid Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalUnpaid)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Bills</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Bills</p>
                <p className="text-2xl font-bold">{bills.filter(b => b.status === 'paid').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
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
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {billStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading bills...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map(bill => {
                  const supplier = suppliers.find(s => s.id === bill.supplierId);
                  const balance = bill.totalAmount - bill.paidAmount;
                  
                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono">{bill.billNumber}</TableCell>
                      <TableCell className="font-medium">{supplier?.name}</TableCell>
                      <TableCell>{new Date(bill.billDate).toLocaleDateString()}</TableCell>
                      <TableCell>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(bill.totalAmount)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(bill.paidAmount)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(balance)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(bill.status)}>
                          {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bill.status !== 'paid' && bill.status !== 'cancelled' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openPaymentDialog(bill)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div><strong>Bill:</strong> {selectedBill.billNumber}</div>
                  <div><strong>Total:</strong> {formatCurrency(selectedBill.totalAmount)}</div>
                  <div><strong>Paid:</strong> {formatCurrency(selectedBill.paidAmount)}</div>
                  <div><strong>Balance:</strong> {formatCurrency(selectedBill.totalAmount - selectedBill.paidAmount)}</div>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentFormData.paymentDate}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="bankAccountId">Bank Account *</Label>
                <Select 
                  value={paymentFormData.bankAccountId.toString()} 
                  onValueChange={(value) => setPaymentFormData(prev => ({ ...prev, bankAccountId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.accountName} - {account.bankName} ({formatCurrency(account.currentBalance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <NumericInput
                  id="amount"
                  value={paymentFormData.amount.toString()}
                  onValueChange={(value) => setPaymentFormData(prev => ({ ...prev, amount: value || 0 }))}
                  placeholder="0.00"
                  allowDecimals={true}
                  maxDecimals={4}
                  allowNegative={false}
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  value={paymentFormData.paymentMethod} 
                  onValueChange={(value: any) => setPaymentFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  value={paymentFormData.referenceNumber}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  placeholder="Check number, transaction ID, etc."
                />
              </div>

              <div>
                <Label htmlFor="paymentNotes">Notes</Label>
                <Textarea
                  id="paymentNotes"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Payment notes"
                  rows={2}
                />
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => { setIsPaymentDialogOpen(false); resetPaymentForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePayment}>
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}