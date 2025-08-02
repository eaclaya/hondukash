'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Invoice, Store } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

export default function InvoicePrintPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuth();

  const invoiceId = params.id as string;

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }

      const data = await response.json();
      setInvoice(data.invoice);

      // Fetch store data for sequence information
      if (data.invoice?.storeId) {
        const storeResponse = await fetch(`/api/stores/${data.invoice.storeId}`, {
          headers: getAuthHeaders()
        });
        
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          setStore(storeData.store);
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.number || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert('Error generating PDF: ' + error.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-HN');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error || 'Invoice not found'}</div>
      </div>
    );
  }

  return (
    <>
      {/* Print Controls - Hidden in print */}
      <div className="no-print fixed top-4 right-4 z-10 flex space-x-2">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Invoice Print Layout */}
      <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <p className="text-gray-600">Invoice #{invoice.number}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">HonduKash ERP</h2>
              <p className="text-gray-600">Invoice Management System</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">BILL TO:</h3>
                <div className="text-gray-700">
                  <p className="font-medium">{invoice.client?.name || invoice.clientName}</p>
                  {invoice.client?.email && <p>{invoice.client.email}</p>}
                  {invoice.client?.phone && <p>{invoice.client.phone}</p>}
                  {invoice.client?.address && <p>{invoice.client.address}</p>}
                  {invoice.client?.city && invoice.client?.state && (
                    <p>{invoice.client.city}, {invoice.client.state}</p>
                  )}
                  {invoice.client?.country && <p>{invoice.client.country}</p>}
                </div>
              </div>
              
              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Invoice Date:</span>
                    <span className="text-gray-700">{formatDate(invoice.invoiceDate)}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Due Date:</span>
                      <span className="text-gray-700">{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Status:</span>
                    <span className="text-gray-700 capitalize">{invoice.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  Qty
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  Unit Price
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">
                    {item.productName || 'Invoice Item'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-gray-700">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-gray-700 font-medium">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mb-8">
          <div className="flex justify-end">
            <div className="w-80">
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm font-medium text-gray-900">Subtotal:</span>
                  <span className="text-gray-700">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm font-medium text-gray-900">Tax:</span>
                  <span className="text-gray-700">{formatCurrency(invoice.tax)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm font-medium text-gray-900">Discount:</span>
                    <span className="text-gray-700">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
                {invoice.paidAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Paid:</span>
                      <span className="text-green-600">-{formatCurrency(invoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-red-600">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(invoice.total - invoice.paidAmount)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="border-t border-gray-200 pt-6">
            {invoice.notes && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes:</h4>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions:</h4>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Invoice Sequence Information */}
        {store?.invoiceSequence?.enabled && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Invoice Sequence Information:</h4>
            <div className="text-gray-700 text-sm space-y-1">
              <p><span className="font-medium">Sequence Hash:</span> {store.invoiceSequence.hash}</p>
              <p><span className="font-medium">Sequence Range:</span> {store.invoiceSequence.sequence_start} - {store.invoiceSequence.sequence_end}</p>
              {store.invoiceSequence.limit_date && (
                <p><span className="font-medium">Valid Until:</span> {formatDate(store.invoiceSequence.limit_date)}</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 mt-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Thank you for your business!</p>
            <p className="mt-2">Generated on {new Date().toLocaleDateString('es-HN')}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-size: 12pt;
            line-height: 1.4;
          }
          
          .print-break {
            page-break-after: always;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
          }
        }
        
        @page {
          size: A4;
          margin: 0.5in;
        }
      `}</style>
    </>
  );
}