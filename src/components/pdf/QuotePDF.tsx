import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import { Quote, Store } from '@/lib/types';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 15,
  },
  companyInfo: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 3,
  },
  quoteTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 3,
  },
  quoteNumber: {
    color: '#6B7280',
    fontSize: 12,
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quoteFor: {
    flex: 1,
    marginRight: 20,
  },
  quoteDetails: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientInfo: {
    color: '#4B5563',
    lineHeight: 1.4,
  },
  clientName: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 3,
  },
  validityNotice: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    color: '#92400E',
  },
  validityText: {
    fontSize: 9,
    lineHeight: 1.3,
  },
  validityBold: {
    fontWeight: 'bold',
    color: '#78350F',
  },
  detailsTable: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  tableCell: {
    color: '#4B5563',
    fontSize: 9,
  },
  descriptionColumn: {
    flex: 3,
  },
  quantityColumn: {
    flex: 1,
    textAlign: 'center',
  },
  priceColumn: {
    flex: 1.5,
    textAlign: 'right',
  },
  totalColumn: {
    flex: 1.5,
    textAlign: 'right',
  },
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalsTable: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: '#2563EB',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#1F2937',
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    paddingTop: 20,
    marginTop: 30,
  },
  notesTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  notesContent: {
    color: '#4B5563',
    lineHeight: 1.4,
    marginBottom: 15,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    color: '#6B7280',
    fontSize: 8,
  },
});


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL'
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-HN');
};

export const createQuotePDF = (quote: Quote, store?: Store | null) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.quoteTitle}>QUOTE</Text>
          <Text style={styles.quoteNumber}>Quote #{quote.number}</Text>
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>HonduKash ERP</Text>
          <Text>Quotation System</Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.detailsSection}>
        <View style={styles.quoteFor}>
          <Text style={styles.sectionTitle}>Quote For:</Text>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {quote.client?.name || quote.clientName || 'N/A'}
            </Text>
            {quote.client?.email && <Text>{quote.client.email}</Text>}
            {quote.client?.phone && <Text>{quote.client.phone}</Text>}
            {quote.client?.address && <Text>{quote.client.address}</Text>}
            {quote.client?.city && quote.client?.state && (
              <Text>{quote.client.city}, {quote.client.state}</Text>
            )}
            {quote.client?.country && <Text>{quote.client.country}</Text>}
          </View>
        </View>
        <View style={styles.quoteDetails}>
          <View style={styles.totalRow}>
            <Text style={styles.tableHeaderText}>Quote Date:</Text>
            <Text style={styles.tableCell}>{formatDate(quote.quoteDate)}</Text>
          </View>
          {quote.validUntil && (
            <View style={styles.totalRow}>
              <Text style={styles.tableHeaderText}>Valid Until:</Text>
              <Text style={styles.tableCell}>{formatDate(quote.validUntil)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.tableHeaderText}>Status:</Text>
            <Text style={[styles.tableCell, { textTransform: 'capitalize' }]}>
              {quote.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Validity Notice */}
      {quote.validUntil && (
        <View style={styles.validityNotice}>
          <Text style={styles.validityText}>
            <Text style={styles.validityBold}>Important:</Text> This quote is valid until {formatDate(quote.validUntil)}. 
            Please confirm your order before this date to secure these prices.
          </Text>
        </View>
      )}

      {/* Items Table */}
      <View style={styles.detailsTable}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.descriptionColumn]}>
            Description
          </Text>
          <Text style={[styles.tableHeaderText, styles.quantityColumn]}>
            Qty
          </Text>
          <Text style={[styles.tableHeaderText, styles.priceColumn]}>
            Unit Price
          </Text>
          <Text style={[styles.tableHeaderText, styles.totalColumn]}>
            Total
          </Text>
        </View>
        {quote.items?.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.descriptionColumn]}>
              {item.productName || 'Quote Item'}
            </Text>
            <Text style={[styles.tableCell, styles.quantityColumn]}>
              {item.quantity}
            </Text>
            <Text style={[styles.tableCell, styles.priceColumn]}>
              {formatCurrency(item.unitPrice)}
            </Text>
            <Text style={[styles.tableCell, styles.totalColumn]}>
              {formatCurrency(item.lineTotal)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsTable}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(quote.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax:</Text>
            <Text>{formatCurrency(quote.tax)}</Text>
          </View>
          {quote.discount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>-{formatCurrency(quote.discount)}</Text>
            </View>
          )}
          <View style={styles.totalRowFinal}>
            <Text>Total Quote Amount:</Text>
            <Text>{formatCurrency(quote.total)}</Text>
          </View>
        </View>
      </View>

      {/* Notes and Terms */}
      {(quote.notes || quote.terms) && (
        <View style={styles.notesSection}>
          {quote.notes && (
            <View>
              <Text style={styles.notesTitle}>Notes:</Text>
              <Text style={styles.notesContent}>{quote.notes}</Text>
            </View>
          )}
          {quote.terms && (
            <View>
              <Text style={styles.notesTitle}>Terms & Conditions:</Text>
              <Text style={styles.notesContent}>{quote.terms}</Text>
            </View>
          )}
        </View>
      )}

      {/* Invoice Sequence Information */}
      {store?.invoiceSequence?.enabled && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Invoice Sequence Information:</Text>
          <Text style={styles.notesContent}>
            Sequence Hash: {store.invoiceSequence.hash}
          </Text>
          <Text style={styles.notesContent}>
            Sequence Range: {store.invoiceSequence.sequence_start} - {store.invoiceSequence.sequence_end}
          </Text>
          {store.invoiceSequence.limit_date && (
            <Text style={styles.notesContent}>
              Valid Until: {formatDate(store.invoiceSequence.limit_date)}
            </Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for considering our services!</Text>
        <Text>We look forward to working with you.</Text>
        <Text>Generated on {new Date().toLocaleDateString('es-HN')}</Text>
      </View>
    </Page>
  </Document>
);