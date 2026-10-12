import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import { useUnifiedData, useUnifiedNotifications } from '../../hooks/shared/useUnifiedState';

interface Lead {
  _id: string;
  lead_number: string;
  name: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  customer_id?: string;
  customer_name?: string;
  subject?: string;
  description?: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  terms_conditions?: string;
  notes?: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  estimated_value?: number;
  organization_id: string;
  created_by: string;
  _creationTime: number;
}

const LeadListScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { selectedOrganization } = useAuth();
  const { showNotification } = useUnifiedNotifications();
  
  // Fetch leads using Convex
  const leads = useQuery(
    api.leads.listLeads,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Mutations
  const createLead = useMutation(api.leads.createLead);
  const updateLead = useMutation(api.leads.updateLead);
  const deleteLead = useMutation(api.leads.deleteLead);
  const convertToQuotation = useMutation(api.leads.convertToQuotation);

  // Unified data management
  const { 
    data: localLeads, 
    setData: setLocalLeads, 
    isLoading, 
    error,
    refresh 
  } = useUnifiedData<Lead[]>(
    'leads',
    leads || [],
    {
      offlineSupport: true,
      syncOnConnect: true,
    }
  );

  // Filter leads based on search term
  const filteredLeads = localLeads?.filter(lead =>
    lead.lead_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handle lead deletion
  const handleDeleteLead = (leadId: string) => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLead({ lead_id: leadId as any });
              showNotification('Lead deleted successfully', 'success');
            } catch (error) {
              showNotification('Failed to delete lead', 'error');
            }
          },
        },
      ]
    );
  };

  // Handle lead selection
  const handleLeadPress = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditMode(false);
    // TODO: Navigate to lead detail screen
  };

  // Handle edit lead
  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditMode(true);
    // TODO: Navigate to lead edit screen
  };

  // Handle convert to quotation
  const handleConvertToQuotation = (lead: Lead) => {
    Alert.alert(
      'Convert to Quotation',
      `Convert lead "${lead.name}" to a quotation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: async () => {
            try {
              const today = new Date();
              const expiryDate = new Date();
              expiryDate.setDate(today.getDate() + 30); // 30 days expiry
              
              await convertToQuotation({
                lead_id: lead._id as any,
                issue_date: today.toISOString().split('T')[0],
                expiry_date: expiryDate.toISOString().split('T')[0],
                terms_conditions: lead.terms_conditions,
                notes: lead.notes,
              });
              showNotification('Lead successfully converted to quotation!', 'success');
            } catch (error) {
              showNotification('Error converting lead to quotation', 'error');
            }
          },
        },
      ]
    );
  };

  // Get status color and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new':
        return { text: 'New', color: '#3182ce' };
      case 'contacted':
        return { text: 'Contacted', color: '#d69e2e' };
      case 'qualified':
        return { text: 'Qualified', color: '#38a169' };
      case 'proposal':
        return { text: 'Proposal', color: '#805ad5' };
      case 'negotiation':
        return { text: 'Negotiation', color: '#dd6b20' };
      case 'closed_won':
        return { text: 'Won', color: '#38a169' };
      case 'closed_lost':
        return { text: 'Lost', color: '#e53e3e' };
      default:
        return { text: 'Unknown', color: '#718096' };
    }
  };

  // Get priority color and text
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'low':
        return { text: 'Low', color: '#38a169' };
      case 'medium':
        return { text: 'Medium', color: '#d69e2e' };
      case 'high':
        return { text: 'High', color: '#dd6b20' };
      case 'urgent':
        return { text: 'Urgent', color: '#e53e3e' };
      default:
        return { text: 'Medium', color: '#d69e2e' };
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'SAR') => {
    if (currency === 'SAR') {
      return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} \uE900`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (leads === undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Lead Management</Text>
          <Text style={styles.subtitle}>Loading leads...</Text>
        </View>
        <ActivityIndicator size="large" color="#3182ce" style={styles.loader} />
      </View>
    );
  }

  // No organization selected
  if (!selectedOrganization) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Lead Management</Text>
          <Text style={styles.subtitle}>Please select an organization to view leads</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No organization selected</Text>
          <Text style={styles.emptySubtext}>
            Please select an organization from the dashboard to manage leads
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (filteredLeads.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Lead Management</Text>
          <Text style={styles.subtitle}>
            {searchTerm ? 'No leads found' : 'No leads yet'}
          </Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchTerm ? 'No leads match your search' : 'No leads created yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Create your first lead to get started'
            }
          </Text>
        </View>
      </View>
    );
  }

  // Render lead item
  const renderLeadItem = ({ item }: { item: Lead }) => {
    const statusInfo = getStatusInfo(item.status);
    const priorityInfo = getPriorityInfo(item.priority);
    
    return (
      <TouchableOpacity
        style={styles.leadCard}
        onPress={() => handleLeadPress(item)}
      >
        <View style={styles.leadHeader}>
          <View style={styles.leadInfo}>
            <Text style={styles.leadNumber}>{item.lead_number}</Text>
            <Text style={styles.leadName}>{item.name}</Text>
            {item.subject && <Text style={styles.leadSubject}>{item.subject}</Text>}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditLead(item)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.convertButton]}
              onPress={() => handleConvertToQuotation(item)}
            >
              <Text style={styles.actionButtonText}>Convert</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteLead(item._id)}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.leadDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer:</Text>
            <Text style={styles.detailValue}>{item.customer_name || item.company || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Priority:</Text>
            <Text style={[styles.detailValue, { color: priorityInfo.color }]}>
              {priorityInfo.text}
            </Text>
          </View>
          
          {item.email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>📧 {item.email}</Text>
            </View>
          )}
          
          {item.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>📞 {item.phone}</Text>
            </View>
          )}
          
          {item.estimated_value && item.estimated_value > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Est. Value:</Text>
              <Text style={[styles.detailValue, (item.currency || 'SAR') === 'SAR' ? { fontFamily: 'saudi_riyal' } : undefined]}>
                {formatCurrency(item.estimated_value, item.currency)}
              </Text>
            </View>
          )}
          
          {item.total_amount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total:</Text>
              <Text style={[styles.detailValue, styles.totalAmount, (item.currency || 'SAR') === 'SAR' ? { fontFamily: 'saudi_riyal' } : undefined]}>
                {formatCurrency(item.total_amount, item.currency)}
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>{formatDate(item._creationTime)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lead Management</Text>
        <Text style={styles.subtitle}>
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#666"
        />
      </View>

      {/* Lead List */}
      <FlatList
        data={filteredLeads}
        renderItem={renderLeadItem}
        keyExtractor={(item) => item._id}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            colors={['#3182ce']}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add Lead Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Create Lead</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#2d3748',
  },
  list: {
    flex: 1,
  },
  leadCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadInfo: {
    flex: 1,
  },
  leadNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 2,
  },
  leadSubject: {
    fontSize: 14,
    color: '#718096',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3182ce',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  convertButton: {
    backgroundColor: '#38a169',
  },
  deleteButton: {
    backgroundColor: '#e53e3e',
  },
  deleteButtonText: {
    color: 'white',
  },
  leadDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2d3748',
    flex: 1,
    textAlign: 'right',
  },
  totalAmount: {
    fontWeight: '600',
    color: '#2d3748',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#3182ce',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LeadListScreen;
