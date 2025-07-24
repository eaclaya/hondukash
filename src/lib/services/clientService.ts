import { Client, ClientContact, CreateClientRequest, UpdateClientRequest, CreateClientContactRequest, UpdateClientContactRequest } from '@/lib/types';
import { TenantService } from './tenantService';

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ClientService {
  // =====================================================
  // CLIENT CRUD OPERATIONS
  // =====================================================

  static async getAllClients(domain: string, storeId?: number): Promise<ServiceResult<Client[]>> {
    try {
      const db = await TenantService.connectToTenantDatabaseByDomain(domain);

      let query = `
        SELECT
          id, store_id as storeId, name, client_type as clientType,
          primary_contact_name as primaryContactName, email, phone, mobile,
          company_registration_number as companyRegistrationNumber,
          tax_id as taxId, industry, website,
          address, city, state, country, postal_code as postalCode,
          credit_limit as creditLimit, payment_terms as paymentTerms,
          discount_percentage as discountPercentage,
          notes, is_active as isActive, created_at as createdAt, updated_at as updatedAt
        FROM clients
        WHERE 1=1
      `;

      const params: any[] = [];

      if (storeId) {
        query += ' AND store_id = ?';
        params.push(storeId);
      }

      query += ' ORDER BY created_at DESC';

      const result = await db.execute({ sql: query, args: params });
      const clients = result.rows.map((row) => ({
        id: Number(row.id),
        storeId: Number(row.storeId),
        name: String(row.name),
        clientType: String(row.clientType) as 'individual' | 'company',
        primaryContactName: row.primaryContactName ? String(row.primaryContactName) : undefined,
        email: row.email ? String(row.email) : undefined,
        phone: row.phone ? String(row.phone) : undefined,
        mobile: row.mobile ? String(row.mobile) : undefined,
        companyRegistrationNumber: row.companyRegistrationNumber ? String(row.companyRegistrationNumber) : undefined,
        taxId: row.taxId ? String(row.taxId) : undefined,
        industry: row.industry ? String(row.industry) : undefined,
        website: row.website ? String(row.website) : undefined,
        address: row.address ? String(row.address) : undefined,
        city: row.city ? String(row.city) : undefined,
        state: row.state ? String(row.state) : undefined,
        country: String(row.country),
        postalCode: row.postalCode ? String(row.postalCode) : undefined,
        creditLimit: Number(row.creditLimit),
        paymentTerms: Number(row.paymentTerms),
        discountPercentage: Number(row.discountPercentage),
        notes: row.notes ? String(row.notes) : undefined,
        isActive: Boolean(row.isActive),
        createdAt: String(row.createdAt),
        updatedAt: String(row.updatedAt)
      }));

      return { success: true, data: clients };
    } catch (error: any) {
      console.error('ClientService.getAllClients error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getClientById(domain: string, clientId: number): Promise<ServiceResult<Client>> {
    try {
      const db = await getTenantDb(domain);

      const query = `
        SELECT
          id, store_id as storeId, name, client_type as clientType,
          primary_contact_name as primaryContactName, email, phone, mobile,
          company_registration_number as companyRegistrationNumber,
          tax_id as taxId, industry, website,
          address, city, state, country, postal_code as postalCode,
          credit_limit as creditLimit, payment_terms as paymentTerms,
          discount_percentage as discountPercentage,
          notes, is_active as isActive, created_at as createdAt, updated_at as updatedAt
        FROM clients
        WHERE id = ?
      `;

      const result = await db.execute({ sql: query, args: [clientId] });

      if (result.rows.length === 0) {
        return { success: false, error: 'Client not found' };
      }

      const row = result.rows[0];
      const client: Client = {
        id: Number(row.id),
        storeId: Number(row.storeId),
        name: String(row.name),
        clientType: String(row.clientType) as 'individual' | 'company',
        primaryContactName: row.primaryContactName ? String(row.primaryContactName) : undefined,
        email: row.email ? String(row.email) : undefined,
        phone: row.phone ? String(row.phone) : undefined,
        mobile: row.mobile ? String(row.mobile) : undefined,
        companyRegistrationNumber: row.companyRegistrationNumber ? String(row.companyRegistrationNumber) : undefined,
        taxId: row.taxId ? String(row.taxId) : undefined,
        industry: row.industry ? String(row.industry) : undefined,
        website: row.website ? String(row.website) : undefined,
        address: row.address ? String(row.address) : undefined,
        city: row.city ? String(row.city) : undefined,
        state: row.state ? String(row.state) : undefined,
        country: String(row.country),
        postalCode: row.postalCode ? String(row.postalCode) : undefined,
        creditLimit: Number(row.creditLimit),
        paymentTerms: Number(row.paymentTerms),
        discountPercentage: Number(row.discountPercentage),
        notes: row.notes ? String(row.notes) : undefined,
        isActive: Boolean(row.isActive),
        createdAt: String(row.createdAt),
        updatedAt: String(row.updatedAt)
      };

      return { success: true, data: client };
    } catch (error: any) {
      console.error('ClientService.getClientById error:', error);
      return { success: false, error: error.message };
    }
  }

  static async createClient(domain: string, clientData: CreateClientRequest): Promise<ServiceResult<Client>> {
    try {
      const db = await getTenantDb(domain);

      const query = `
        INSERT INTO clients (
          store_id, name, client_type, primary_contact_name, email, phone, mobile,
          company_registration_number, tax_id, industry, website,
          address, city, state, country, postal_code,
          credit_limit, payment_terms, discount_percentage, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        clientData.storeId || 1,
        clientData.name,
        clientData.clientType,
        clientData.primaryContactName || null,
        clientData.email || null,
        clientData.phone || null,
        clientData.mobile || null,
        clientData.companyRegistrationNumber || null,
        clientData.taxId || null,
        clientData.industry || null,
        clientData.website || null,
        clientData.address || null,
        clientData.city || null,
        clientData.state || null,
        clientData.country || 'Honduras',
        clientData.postalCode || null,
        clientData.creditLimit || 0,
        clientData.paymentTerms || 30,
        clientData.discountPercentage || 0,
        clientData.notes || null
      ];

      const result = await db.execute({ sql: query, args: values });
      const clientId = Number(result.lastInsertRowid);

      // Fetch the created client
      const clientResult = await this.getClientById(domain, clientId);
      if (!clientResult.success || !clientResult.data) {
        return { success: false, error: 'Failed to fetch created client' };
      }

      return { success: true, data: clientResult.data };
    } catch (error: any) {
      console.error('ClientService.createClient error:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateClient(domain: string, clientData: UpdateClientRequest): Promise<ServiceResult<Client>> {
    try {
      const db = await getTenantDb(domain);

      const fields: string[] = [];
      const values: any[] = [];

      if (clientData.name !== undefined) {
        fields.push('name = ?');
        values.push(clientData.name);
      }

      if (clientData.clientType !== undefined) {
        fields.push('client_type = ?');
        values.push(clientData.clientType);
      }

      if (clientData.primaryContactName !== undefined) {
        fields.push('primary_contact_name = ?');
        values.push(clientData.primaryContactName);
      }

      if (clientData.email !== undefined) {
        fields.push('email = ?');
        values.push(clientData.email);
      }

      if (clientData.phone !== undefined) {
        fields.push('phone = ?');
        values.push(clientData.phone);
      }

      if (clientData.mobile !== undefined) {
        fields.push('mobile = ?');
        values.push(clientData.mobile);
      }

      if (clientData.companyRegistrationNumber !== undefined) {
        fields.push('company_registration_number = ?');
        values.push(clientData.companyRegistrationNumber);
      }

      if (clientData.taxId !== undefined) {
        fields.push('tax_id = ?');
        values.push(clientData.taxId);
      }

      if (clientData.industry !== undefined) {
        fields.push('industry = ?');
        values.push(clientData.industry);
      }

      if (clientData.website !== undefined) {
        fields.push('website = ?');
        values.push(clientData.website);
      }

      if (clientData.address !== undefined) {
        fields.push('address = ?');
        values.push(clientData.address);
      }

      if (clientData.city !== undefined) {
        fields.push('city = ?');
        values.push(clientData.city);
      }

      if (clientData.state !== undefined) {
        fields.push('state = ?');
        values.push(clientData.state);
      }

      if (clientData.country !== undefined) {
        fields.push('country = ?');
        values.push(clientData.country);
      }

      if (clientData.postalCode !== undefined) {
        fields.push('postal_code = ?');
        values.push(clientData.postalCode);
      }

      if (clientData.creditLimit !== undefined) {
        fields.push('credit_limit = ?');
        values.push(clientData.creditLimit);
      }

      if (clientData.paymentTerms !== undefined) {
        fields.push('payment_terms = ?');
        values.push(clientData.paymentTerms);
      }

      if (clientData.discountPercentage !== undefined) {
        fields.push('discount_percentage = ?');
        values.push(clientData.discountPercentage);
      }

      if (clientData.notes !== undefined) {
        fields.push('notes = ?');
        values.push(clientData.notes);
      }

      if (fields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      fields.push("updated_at = datetime('now', 'utc')");
      values.push(clientData.id);

      const query = `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`;

      await db.execute({ sql: query, args: values });

      // Fetch the updated client
      const clientResult = await this.getClientById(domain, clientData.id);
      if (!clientResult.success || !clientResult.data) {
        return { success: false, error: 'Failed to fetch updated client' };
      }

      return { success: true, data: clientResult.data };
    } catch (error: any) {
      console.error('ClientService.updateClient error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteClient(domain: string, clientId: number): Promise<ServiceResult<void>> {
    try {
      const db = await getTenantDb(domain);

      const query = 'DELETE FROM clients WHERE id = ?';
      await db.execute({ sql: query, args: [clientId] });

      return { success: true };
    } catch (error: any) {
      console.error('ClientService.deleteClient error:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================================================
  // CLIENT CONTACT CRUD OPERATIONS
  // =====================================================

  static async getClientContacts(domain: string, clientId: number): Promise<ServiceResult<ClientContact[]>> {
    try {
      const db = await getTenantDb(domain);

      const query = `
        SELECT
          id, client_id as clientId, contact_name as contactName, job_title as jobTitle, department,
          email, phone, mobile, extension,
          contact_type as contactType, can_make_purchases as canMakePurchases,
          purchase_limit as purchaseLimit, requires_approval as requiresApproval,
          preferred_contact_method as preferredContactMethod, language, timezone,
          is_primary as isPrimary, is_active as isActive,
          notes, created_at as createdAt, updated_at as updatedAt
        FROM client_contacts
        WHERE client_id = ?
        ORDER BY is_primary DESC, created_at DESC
      `;

      const result = await db.execute({ sql: query, args: [clientId] });
      const contacts = result.rows.map((row) => ({
        id: Number(row.id),
        clientId: Number(row.clientId),
        contactName: String(row.contactName),
        jobTitle: row.jobTitle ? String(row.jobTitle) : undefined,
        department: row.department ? String(row.department) : undefined,
        email: row.email ? String(row.email) : undefined,
        phone: row.phone ? String(row.phone) : undefined,
        mobile: row.mobile ? String(row.mobile) : undefined,
        extension: row.extension ? String(row.extension) : undefined,
        contactType: String(row.contactType) as ClientContact['contactType'],
        canMakePurchases: Boolean(row.canMakePurchases),
        purchaseLimit: row.purchaseLimit ? Number(row.purchaseLimit) : undefined,
        requiresApproval: Boolean(row.requiresApproval),
        preferredContactMethod: String(row.preferredContactMethod) as ClientContact['preferredContactMethod'],
        language: String(row.language),
        timezone: String(row.timezone),
        isPrimary: Boolean(row.isPrimary),
        isActive: Boolean(row.isActive),
        notes: row.notes ? String(row.notes) : undefined,
        createdAt: String(row.createdAt),
        updatedAt: String(row.updatedAt)
      }));

      return { success: true, data: contacts };
    } catch (error: any) {
      console.error('ClientService.getClientContacts error:', error);
      return { success: false, error: error.message };
    }
  }

  static async createClientContact(domain: string, contactData: CreateClientContactRequest): Promise<ServiceResult<ClientContact>> {
    try {
      const db = await getTenantDb(domain);

      const query = `
        INSERT INTO client_contacts (
          client_id, contact_name, job_title, department,
          email, phone, mobile, extension,
          contact_type, can_make_purchases, purchase_limit, requires_approval,
          preferred_contact_method, language, timezone, is_primary, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        contactData.clientId,
        contactData.contactName,
        contactData.jobTitle || null,
        contactData.department || null,
        contactData.email || null,
        contactData.phone || null,
        contactData.mobile || null,
        contactData.extension || null,
        contactData.contactType || 'employee',
        contactData.canMakePurchases || false,
        contactData.purchaseLimit || null,
        contactData.requiresApproval || true,
        contactData.preferredContactMethod || 'email',
        contactData.language || 'en',
        contactData.timezone || 'America/Tegucigalpa',
        contactData.isPrimary || false,
        contactData.notes || null
      ];

      const result = await db.execute({ sql: query, args: values });
      const contactId = Number(result.lastInsertRowid);

      // Fetch the created contact
      const contactQuery = `
        SELECT
          id, client_id as clientId, contact_name as contactName, job_title as jobTitle, department,
          email, phone, mobile, extension,
          contact_type as contactType, can_make_purchases as canMakePurchases,
          purchase_limit as purchaseLimit, requires_approval as requiresApproval,
          preferred_contact_method as preferredContactMethod, language, timezone,
          is_primary as isPrimary, is_active as isActive,
          notes, created_at as createdAt, updated_at as updatedAt
        FROM client_contacts
        WHERE id = ?
      `;

      const contactResult = await db.execute({ sql: contactQuery, args: [contactId] });

      if (contactResult.rows.length === 0) {
        return { success: false, error: 'Failed to fetch created contact' };
      }

      const row = contactResult.rows[0];
      const contact: ClientContact = {
        id: Number(row.id),
        clientId: Number(row.clientId),
        contactName: String(row.contactName),
        jobTitle: row.jobTitle ? String(row.jobTitle) : undefined,
        department: row.department ? String(row.department) : undefined,
        email: row.email ? String(row.email) : undefined,
        phone: row.phone ? String(row.phone) : undefined,
        mobile: row.mobile ? String(row.mobile) : undefined,
        extension: row.extension ? String(row.extension) : undefined,
        contactType: String(row.contactType) as ClientContact['contactType'],
        canMakePurchases: Boolean(row.canMakePurchases),
        purchaseLimit: row.purchaseLimit ? Number(row.purchaseLimit) : undefined,
        requiresApproval: Boolean(row.requiresApproval),
        preferredContactMethod: String(row.preferredContactMethod) as ClientContact['preferredContactMethod'],
        language: String(row.language),
        timezone: String(row.timezone),
        isPrimary: Boolean(row.isPrimary),
        isActive: Boolean(row.isActive),
        notes: row.notes ? String(row.notes) : undefined,
        createdAt: String(row.createdAt),
        updatedAt: String(row.updatedAt)
      };

      return { success: true, data: contact };
    } catch (error: any) {
      console.error('ClientService.createClientContact error:', error);
      return { success: false, error: error.message };
    }
  }
}
