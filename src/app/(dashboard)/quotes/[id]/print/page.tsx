'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Quote, Store } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

export default function QuotePrintPage() {
  const params = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuth();

  const quoteId = params.id as string;

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quotes/${quoteId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }

      const data = await response.json();
      setQuote(data.quote);

      // Fetch store data for sequence information
      if (data.quote?.storeId) {
        const storeResponse = await fetch(`/api/stores/${data.quote.storeId}`, {
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
      const response = await fetch(`/api/quotes/${quoteId}/pdf`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quote?.number || quoteId}.pdf`;
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
        <div>Loading quote...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error || 'Quote not found'}</div>
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

      {/* Quote Print Layout */}
      <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">QUOTE</h1>
              <p className="text-gray-600">Quote #{quote.number}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">HonduKash ERP</h2>
              <p className="text-gray-600">Quotation System</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">QUOTE FOR:</h3>
                <div className="text-gray-700">
                  <p className="font-medium">{quote.client?.name || quote.clientName}</p>
                  {quote.client?.email && <p>{quote.client.email}</p>}
                  {quote.client?.phone && <p>{quote.client.phone}</p>}
                  {quote.client?.address && <p>{quote.client.address}</p>}
                  {quote.client?.city && quote.client?.state && (
                    <p>{quote.client.city}, {quote.client.state}</p>
                  )}
                  {quote.client?.country && <p>{quote.client.country}</p>}
                </div>
              </div>
              
              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Quote Date:</span>
                    <span className="text-gray-700">{formatDate(quote.quoteDate)}</span>
                  </div>
                  {quote.validUntil && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Valid Until:</span>
                      <span className="text-gray-700">{formatDate(quote.validUntil)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Status:</span>
                    <span className="text-gray-700 capitalize">{quote.status}</span>
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
              <tr className="bg-blue-50">
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
              {quote.items?.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">
                    {item.productName || 'Quote Item'}
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
                  <span className="text-gray-700">{formatCurrency(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm font-medium text-gray-900">Tax:</span>
                  <span className="text-gray-700">{formatCurrency(quote.tax)}</span>
                </div>
                {quote.discount > 0 && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm font-medium text-gray-900">Discount:</span>
                    <span className="text-gray-700">-{formatCurrency(quote.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total Quote Amount:</span>
                  <span>{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Validity Notice */}
        {quote.validUntil && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> This quote is valid until {formatDate(quote.validUntil)}. 
              Please confirm your order before this date to secure these prices.
            </p>
          </div>
        )}

        {/* Notes and Terms */}
        {(quote.notes || quote.terms) && (
          <div className="border-t border-gray-200 pt-6">
            {quote.notes && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes:</h4>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
            {quote.terms && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions:</h4>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{quote.terms}</p>
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
            <p>Thank you for considering our services!</p>
            <p className="mt-1">We look forward to working with you.</p>
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