import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import { Invoice, Store } from '@/lib/types';

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
    color: '#1F2937',
    marginBottom: 3,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 3,
  },
  invoiceNumber: {
    color: '#6B7280',
    fontSize: 12,
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billTo: {
    flex: 1,
    marginRight: 20,
  },
  invoiceDetails: {
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
  detailsTable: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
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
    borderTopColor: '#1F2937',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#1F2937',
  },
  paidAmount: {
    color: '#059669',
  },
  balanceDue: {
    color: '#DC2626',
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

export const createInvoicePDF = (invoice: Invoice, store?: Store | null) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>Invoice #{invoice.number}</Text>
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>HonduKash ERP</Text>
          <Text>Invoice Management System</Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.detailsSection}>
        <View style={styles.billTo}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {invoice.client?.name || invoice.clientName || 'N/A'}
            </Text>
            {invoice.client?.email && <Text>{invoice.client.email}</Text>}
            {invoice.client?.phone && <Text>{invoice.client.phone}</Text>}
            {invoice.client?.address && <Text>{invoice.client.address}</Text>}
            {invoice.client?.city && invoice.client?.state && (
              <Text>{invoice.client.city}, {invoice.client.state}</Text>
            )}
            {invoice.client?.country && <Text>{invoice.client.country}</Text>}
          </View>
        </View>
        <View style={styles.invoiceDetails}>
          <View style={styles.totalRow}>
            <Text style={styles.tableHeaderText}>Invoice Date:</Text>
            <Text style={styles.tableCell}>{formatDate(invoice.invoiceDate)}</Text>
          </View>
          {invoice.dueDate && (
            <View style={styles.totalRow}>
              <Text style={styles.tableHeaderText}>Due Date:</Text>
              <Text style={styles.tableCell}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.tableHeaderText}>Status:</Text>
            <Text style={[styles.tableCell, { textTransform: 'capitalize' }]}>
              {invoice.status}
            </Text>
          </View>
        </View>
      </View>

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
        {invoice.items?.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.descriptionColumn]}>
              {item.productName || 'Invoice Item'}
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
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax:</Text>
            <Text>{formatCurrency(invoice.tax)}</Text>
          </View>
          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>-{formatCurrency(invoice.discount)}</Text>
            </View>
          )}
          <View style={styles.totalRowFinal}>
            <Text>Total:</Text>
            <Text>{formatCurrency(invoice.total)}</Text>
          </View>
          {invoice.paidAmount > 0 && (
            <>
              <View style={[styles.totalRow, styles.paidAmount]}>
                <Text>Paid:</Text>
                <Text>-{formatCurrency(invoice.paidAmount)}</Text>
              </View>
              <View style={[styles.totalRowFinal, styles.balanceDue]}>
                <Text>Balance Due:</Text>
                <Text>{formatCurrency(invoice.total - invoice.paidAmount)}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Notes and Terms */}
      {(invoice.notes || invoice.terms) && (
        <View style={styles.notesSection}>
          {invoice.notes && (
            <View>
              <Text style={styles.notesTitle}>Notes:</Text>
              <Text style={styles.notesContent}>{invoice.notes}</Text>
            </View>
          )}
          {invoice.terms && (
            <View>
              <Text style={styles.notesTitle}>Terms & Conditions:</Text>
              <Text style={styles.notesContent}>{invoice.terms}</Text>
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
        <Text>Thank you for your business!</Text>
        <Text>Generated on {new Date().toLocaleDateString('es-HN')}</Text>
      </View>
    </Page>
  </Document>
);