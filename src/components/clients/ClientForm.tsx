'use client';

import { useState } from 'react';
import { Client, CreateClientRequest, UpdateClientRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Building, User, Mail, Phone, MapPin, CreditCard, Tags, ExternalLink } from 'lucide-react';
import SimpleTagSelector from '@/components/tags/SimpleTagSelector';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslations } from '@/contexts/LocaleContext';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientRequest | UpdateClientRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface ContactFormData {
  contactName: string;
  jobTitle?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  extension?: string;
  contactType: 'primary' | 'employee' | 'manager' | 'executive' | 'procurement' | 'accounting' | 'other';
  canMakePurchases: boolean;
  purchaseLimit?: number;
  requiresApproval: boolean;
  preferredContactMethod: 'email' | 'phone' | 'mobile';
  language: string;
  timezone: string;
  isPrimary: boolean;
  notes?: string;
}

export default function ClientForm({ client, onSubmit, onCancel, loading = false }: ClientFormProps) {
  const t = useTranslations('clients');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState<CreateClientRequest | UpdateClientRequest>({
    ...(client?.id && { id: client.id }),
    storeId: client?.storeId || 1,
    name: client?.name || '',
    clientType: client?.clientType || 'individual',
    primaryContactName: client?.primaryContactName || '',
    email: client?.email || '',
    phone: client?.phone || '',
    mobile: client?.mobile || '',
    companyRegistrationNumber: client?.companyRegistrationNumber || '',
    industry: client?.industry || '',
    website: client?.website || '',
    address: client?.address || '',
    city: client?.city || '',
    state: client?.state || '',
    country: client?.country || 'Honduras',
    postalCode: client?.postalCode || '',
    creditLimit: client?.creditLimit || 0,
    paymentTerms: client?.paymentTerms || 30,
    notes: client?.notes || '',
    tags: client?.tags || [],
  });


  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (!client || !client.tags) return [];
    
    // If tags is already an array, use it directly
    if (Array.isArray(client.tags)) {
      return client.tags;
    }
    
    // If tags is a string, try to parse it as JSON
    if (typeof client.tags === 'string') {
      try {
        const parsed = JSON.parse(client.tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // If JSON parsing fails, split by comma and clean up
        return (client.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
    }
    
    return [];
  });

  const [contacts, setContacts] = useState<ContactFormData[]>(
    client?.contacts?.map(contact => ({
      contactName: contact.contactName,
      jobTitle: contact.jobTitle || '',
      department: contact.department || '',
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      extension: contact.extension || '',
      contactType: contact.contactType,
      canMakePurchases: contact.canMakePurchases,
      purchaseLimit: contact.purchaseLimit || 0,
      requiresApproval: contact.requiresApproval,
      preferredContactMethod: contact.preferredContactMethod,
      language: contact.language,
      timezone: contact.timezone,
      isPrimary: contact.isPrimary,
      notes: contact.notes || '',
    })) || []
  );
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert local contact data to the format expected by the API
    const contactsData = contacts.map(contact => ({
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
      notes: contact.notes || undefined,
    }));

    const submitData = {
      ...formData,
      tags: selectedTags,
      contacts: contactsData
    };

    await onSubmit(submitData);
  };

  const addContact = () => {
    setEditingContactIndex(-1); // -1 indicates new contact
    setShowContactForm(true);
  };

  const saveContact = (contact: ContactFormData) => {
    if (editingContactIndex === -1) {
      // Adding new contact
      setContacts(prev => [...prev, contact]);
    } else {
      // Updating existing contact
      setContacts(prev => prev.map((c, i) => i === editingContactIndex ? contact : c));
    }
    setShowContactForm(false);
    setEditingContactIndex(null);
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {client ? t('editClient') : t('createNewClient')}
          </h1>
          <p className="text-slate-600">
            {client ? t('updateClientInfo') : t('addNewClientToSystem')}
          </p>
        </div>
        <div className="flex space-x-3">
          {client?.id && (
            <Link href={`/tags/clients/${client.id}`}>
              <Button variant="outline" className="flex items-center space-x-2">
                <Tags className="h-4 w-4" />
                <span>{t('manageTags')}</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="btn-primary-modern">
            {loading ? tCommon('saving') : client ? t('updateClient') : t('createClient')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className={`grid w-full ${formData.clientType === 'company' ? 'grid-cols-3' : 'grid-cols-1'}`}>
          <TabsTrigger value="basic">{t('basicInformation')}</TabsTrigger>
          {formData.clientType === 'company' && (
            <>
              <TabsTrigger value="business">{t('businessDetails')}</TabsTrigger>
              <TabsTrigger value="contacts">{t('contacts')}</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{t('clientInformation')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientType">{t('clientType')}</Label>
                  <Select
                    value={formData.clientType}
                    onValueChange={(value) => handleInputChange('clientType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectClientType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">{t('individual')}</SelectItem>
                      <SelectItem value="company">{t('company')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    {formData.clientType === 'company' ? t('companyName') : t('fullName')} *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={formData.clientType === 'company' ? t('enterCompanyName') : t('enterFullName')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryContactName">{t('primaryContact')}</Label>
                  <Input
                    id="primaryContactName"
                    value={formData.primaryContactName}
                    onChange={(e) => handleInputChange('primaryContactName', e.target.value)}
                    placeholder={t('enterPrimaryContactName')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('enterEmailAddress')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={t('enterPhoneNumber')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">{t('mobile')}</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder={t('enterMobileNumber')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>{t('addressInformation')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="Enter state or province"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Financial Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit (L)</Label>
                  <NumericInput
                    id="creditLimit"
                    value={formData.creditLimit.toString()}
                    onValueChange={(value) => handleInputChange('creditLimit', value || 0)}
                    placeholder="0.00"
                    allowDecimals={true}
                    maxDecimals={2}
                    allowNegative={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                  <NumericInput
                    id="paymentTerms"
                    value={formData.paymentTerms.toString()}
                    onValueChange={(value) => handleInputChange('paymentTerms', Math.floor(value || 0))}
                    placeholder="30"
                    allowDecimals={false}
                    allowNegative={false}
                  />
                </div>

              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes about this client"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <SimpleTagSelector
                  selectedTagNames={selectedTags}
                  onTagsChange={setSelectedTags}
                  storeId={formData.storeId}
                  categoryFilter={['client', 'general']}
                  label="Client Tags"
                  placeholder="Select tags for this client..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {formData.clientType === 'company' && (
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Company Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyRegistrationNumber">Registration Number</Label>
                    <Input
                      id="companyRegistrationNumber"
                      value={formData.companyRegistrationNumber}
                      onChange={(e) => handleInputChange('companyRegistrationNumber', e.target.value)}
                      placeholder="Enter registration number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      placeholder="Enter industry"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="Enter website URL"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {formData.clientType === 'company' && (
          <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Contact Management</span>
                </div>
                <Button onClick={addContact} size="sm" className="btn-primary-modern">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <Phone className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No contacts added</h3>
                  <p className="text-slate-600 mb-4">Add contacts to manage communication with this client.</p>
                  <Button onClick={addContact} className="btn-primary-modern">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Contact
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900">{contact.contactName || 'Unnamed Contact'}</h4>
                            <p className="text-sm text-slate-600">{contact.jobTitle || contact.contactType}</p>
                          </div>
                          {contact.isPrimary && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingContactIndex(index);
                              setShowContactForm(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContact(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                        {contact.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showContactForm && (
                <ContactForm
                  contact={editingContactIndex !== -1 && editingContactIndex !== null ? contacts[editingContactIndex] : undefined}
                  onSave={saveContact}
                  onCancel={() => {
                    setShowContactForm(false);
                    setEditingContactIndex(null);
                  }}
                  isPrimary={contacts.length === 0 && editingContactIndex === -1}
                />
              )}
            </CardContent>
          </Card>
          </TabsContent>
        )}

      </Tabs>
    </div>
  );
}

interface ContactFormProps {
  contact?: ContactFormData;
  onSave: (contact: ContactFormData) => void;
  onCancel: () => void;
  isPrimary?: boolean;
}

function ContactForm({ contact, onSave, onCancel, isPrimary = false }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    contactName: contact?.contactName || '',
    jobTitle: contact?.jobTitle || '',
    department: contact?.department || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    mobile: contact?.mobile || '',
    extension: contact?.extension || '',
    contactType: contact?.contactType || 'employee',
    canMakePurchases: contact?.canMakePurchases ?? true,
    purchaseLimit: contact?.purchaseLimit || 0,
    requiresApproval: contact?.requiresApproval ?? false,
    preferredContactMethod: contact?.preferredContactMethod || 'email',
    language: contact?.language || 'es',
    timezone: contact?.timezone || 'America/Tegucigalpa',
    isPrimary: contact?.isPrimary ?? isPrimary,
    notes: contact?.notes || '',
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactName.trim()) {
      toast.error('Contact name is required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="border-t pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-slate-900">
          {contact ? 'Edit Contact' : 'Add New Contact'}
        </h4>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name *</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => handleInputChange('contactName', e.target.value)}
              placeholder="Enter contact name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              placeholder="Enter job title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              placeholder="Enter department"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactType">Contact Type</Label>
            <Select
              value={formData.contactType}
              onValueChange={(value) => handleInputChange('contactType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
                <SelectItem value="procurement">Procurement</SelectItem>
                <SelectItem value="accounting">Accounting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone</Label>
            <Input
              id="contactPhone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactMobile">Mobile</Label>
            <Input
              id="contactMobile"
              value={formData.mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
              placeholder="Enter mobile number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extension">Extension</Label>
            <Input
              id="extension"
              value={formData.extension}
              onChange={(e) => handleInputChange('extension', e.target.value)}
              placeholder="Enter extension"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
            <Select
              value={formData.preferredContactMethod}
              onValueChange={(value) => handleInputChange('preferredContactMethod', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preferred method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => handleInputChange('language', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.canMakePurchases}
                onChange={(e) => handleInputChange('canMakePurchases', e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm">Can make purchases</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm">Requires approval</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPrimary}
                onChange={(e) => handleInputChange('isPrimary', e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm">Primary contact</span>
            </label>
          </div>

          {formData.canMakePurchases && (
            <div className="space-y-2">
              <Label htmlFor="purchaseLimit">Purchase Limit (L)</Label>
              <NumericInput
                id="purchaseLimit"
                value={formData.purchaseLimit.toString()}
                onValueChange={(value) => handleInputChange('purchaseLimit', value || 0)}
                placeholder="0.00"
                allowDecimals={true}
                maxDecimals={2}
                allowNegative={false}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="contactNotes">Notes</Label>
            <Textarea
              id="contactNotes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes about this contact"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary-modern">
            {contact ? 'Update Contact' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </div>
  );
}