import { Client, ClientContact, CreateClientRequest, UpdateClientRequest, CreateClientContactRequest, UpdateClientContactRequest } from '@/lib/types';
import { getTenantDb } from '@/lib/turso';
import { clients, clientContacts } from '@/lib/db/schema/tenant';
import { eq, and, desc } from 'drizzle-orm';

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
      const db = await getTenantDb(domain);

      const queryConditions = [];
      if (storeId) {
        queryConditions.push(eq(clients.storeId, storeId));
      }

      const clientsResult = await db.query.clients.findMany({
        where: queryConditions.length > 0 ? and(...queryConditions) : undefined,
        orderBy: [desc(clients.createdAt)]
      });

      const mappedClients: Client[] = clientsResult.map((client) => ({
        id: client.id,
        storeId: client.storeId,
        name: client.name,
        clientType: client.clientType,
        primaryContactName: client.primaryContactName || undefined,
        email: client.email || undefined,
        phone: client.phone || undefined,
        mobile: client.mobile || undefined,
        companyRegistrationNumber: client.companyRegistrationNumber || undefined,
        taxId: client.taxId || undefined,
        industry: client.industry || undefined,
        website: client.website || undefined,
        address: client.address || undefined,
        city: client.city || undefined,
        state: client.state || undefined,
        country: client.country,
        postalCode: client.postalCode || undefined,
        creditLimit: client.creditLimit,
        paymentTerms: client.paymentTerms,
        discountPercentage: client.discountPercentage,
        notes: client.notes || undefined,
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      }));

      return { success: true, data: mappedClients };
    } catch (error: any) {
      console.error('ClientService.getAllClients error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getClientById(domain: string, clientId: number): Promise<ServiceResult<Client>> {
    try {
      const db = await getTenantDb(domain);

      const client = await db.query.clients.findFirst({
        where: eq(clients.id, clientId)
      });

      if (!client) {
        return { success: false, error: 'Client not found' };
      }

      const mappedClient: Client = {
        id: client.id,
        storeId: client.storeId,
        name: client.name,
        clientType: client.clientType,
        primaryContactName: client.primaryContactName || undefined,
        email: client.email || undefined,
        phone: client.phone || undefined,
        mobile: client.mobile || undefined,
        companyRegistrationNumber: client.companyRegistrationNumber || undefined,
        taxId: client.taxId || undefined,
        industry: client.industry || undefined,
        website: client.website || undefined,
        address: client.address || undefined,
        city: client.city || undefined,
        state: client.state || undefined,
        country: client.country,
        postalCode: client.postalCode || undefined,
        creditLimit: client.creditLimit,
        paymentTerms: client.paymentTerms,
        discountPercentage: client.discountPercentage,
        notes: client.notes || undefined,
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      };

      return { success: true, data: mappedClient };
    } catch (error: any) {
      console.error('ClientService.getClientById error:', error);
      return { success: false, error: error.message };
    }
  }

  static async createClient(domain: string, clientData: CreateClientRequest): Promise<ServiceResult<Client>> {
    try {
      const db = await getTenantDb(domain);

      const newClient = await db
        .insert(clients)
        .values({
          storeId: clientData.storeId || 1,
          name: clientData.name,
          clientType: clientData.clientType,
          primaryContactName: clientData.primaryContactName || null,
          email: clientData.email || null,
          phone: clientData.phone || null,
          mobile: clientData.mobile || null,
          companyRegistrationNumber: clientData.companyRegistrationNumber || null,
          taxId: clientData.taxId || null,
          industry: clientData.industry || null,
          website: clientData.website || null,
          address: clientData.address || null,
          city: clientData.city || null,
          state: clientData.state || null,
          country: clientData.country || 'Honduras',
          postalCode: clientData.postalCode || null,
          creditLimit: clientData.creditLimit || 0,
          paymentTerms: clientData.paymentTerms || 30,
          discountPercentage: clientData.discountPercentage || 0,
          notes: clientData.notes || null
        })
        .returning();

      if (!newClient[0]) {
        return { success: false, error: 'Failed to create client' };
      }

      // Fetch the created client
      const clientResult = await this.getClientById(domain, newClient[0].id);
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

      const updateData: any = {};

      if (clientData.name !== undefined) updateData.name = clientData.name;
      if (clientData.clientType !== undefined) updateData.clientType = clientData.clientType;
      if (clientData.primaryContactName !== undefined) updateData.primaryContactName = clientData.primaryContactName;
      if (clientData.email !== undefined) updateData.email = clientData.email;
      if (clientData.phone !== undefined) updateData.phone = clientData.phone;
      if (clientData.mobile !== undefined) updateData.mobile = clientData.mobile;
      if (clientData.companyRegistrationNumber !== undefined) updateData.companyRegistrationNumber = clientData.companyRegistrationNumber;
      if (clientData.taxId !== undefined) updateData.taxId = clientData.taxId;
      if (clientData.industry !== undefined) updateData.industry = clientData.industry;
      if (clientData.website !== undefined) updateData.website = clientData.website;
      if (clientData.address !== undefined) updateData.address = clientData.address;
      if (clientData.city !== undefined) updateData.city = clientData.city;
      if (clientData.state !== undefined) updateData.state = clientData.state;
      if (clientData.country !== undefined) updateData.country = clientData.country;
      if (clientData.postalCode !== undefined) updateData.postalCode = clientData.postalCode;
      if (clientData.creditLimit !== undefined) updateData.creditLimit = clientData.creditLimit;
      if (clientData.paymentTerms !== undefined) updateData.paymentTerms = clientData.paymentTerms;
      if (clientData.discountPercentage !== undefined) updateData.discountPercentage = clientData.discountPercentage;
      if (clientData.notes !== undefined) updateData.notes = clientData.notes;

      if (Object.keys(updateData).length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      updateData.updatedAt = new Date().toISOString();

      await db.update(clients).set(updateData).where(eq(clients.id, clientData.id));

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

      await db.delete(clients).where(eq(clients.id, clientId));

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

      const contacts = await db.query.clientContacts.findMany({
        where: eq(clientContacts.clientId, clientId),
        orderBy: [desc(clientContacts.isPrimary), desc(clientContacts.createdAt)]
      });

      const mappedContacts: ClientContact[] = contacts.map((contact) => ({
        id: contact.id,
        clientId: contact.clientId,
        contactName: contact.contactName,
        jobTitle: contact.jobTitle || undefined,
        department: contact.department || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        mobile: contact.mobile || undefined,
        extension: contact.extension || undefined,
        contactType: contact.contactType,
        canMakePurchases: contact.canMakePurchases,
        purchaseLimit: contact.purchaseLimit || undefined,
        requiresApproval: contact.requiresApproval,
        preferredContactMethod: contact.preferredContactMethod,
        language: contact.language,
        timezone: contact.timezone,
        isPrimary: contact.isPrimary,
        isActive: contact.isActive,
        notes: contact.notes || undefined,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt
      }));

      return { success: true, data: mappedContacts };
    } catch (error: any) {
      console.error('ClientService.getClientContacts error:', error);
      return { success: false, error: error.message };
    }
  }

  static async createClientContact(domain: string, contactData: CreateClientContactRequest): Promise<ServiceResult<ClientContact>> {
    try {
      const db = await getTenantDb(domain);

      const newContact = await db
        .insert(clientContacts)
        .values({
          clientId: contactData.clientId!,
          contactName: contactData.contactName,
          jobTitle: contactData.jobTitle || null,
          department: contactData.department || null,
          email: contactData.email || null,
          phone: contactData.phone || null,
          mobile: contactData.mobile || null,
          extension: contactData.extension || null,
          contactType: contactData.contactType || 'employee',
          canMakePurchases: contactData.canMakePurchases || true,
          purchaseLimit: contactData.purchaseLimit || null,
          requiresApproval: contactData.requiresApproval || false,
          preferredContactMethod: contactData.preferredContactMethod || 'email',
          language: contactData.language || 'es',
          timezone: contactData.timezone || 'America/Tegucigalpa',
          isPrimary: contactData.isPrimary || false,
          notes: contactData.notes || null
        })
        .returning();

      if (!newContact[0]) {
        return { success: false, error: 'Failed to create contact' };
      }

      const contact = newContact[0];
      const mappedContact: ClientContact = {
        id: contact.id,
        clientId: contact.clientId,
        contactName: contact.contactName,
        jobTitle: contact.jobTitle || undefined,
        department: contact.department || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        mobile: contact.mobile || undefined,
        extension: contact.extension || undefined,
        contactType: contact.contactType,
        canMakePurchases: contact.canMakePurchases,
        purchaseLimit: contact.purchaseLimit || undefined,
        requiresApproval: contact.requiresApproval,
        preferredContactMethod: contact.preferredContactMethod,
        language: contact.language,
        timezone: contact.timezone,
        isPrimary: contact.isPrimary,
        isActive: contact.isActive,
        notes: contact.notes || undefined,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt
      };

      return { success: true, data: mappedContact };
    } catch (error: any) {
      console.error('ClientService.createClientContact error:', error);
      return { success: false, error: error.message };
    }
  }
}
