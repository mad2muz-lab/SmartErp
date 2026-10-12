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

interface Quotation {
  _id: string;
  quotation_number: string;
  customer_id?: string;
  customer_name?: string;
  subject?: string;
  issue_date: number;
  expiry_date?: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  terms_conditions?: string;
  organization_id: string;
  created_by: string;
  _creationTime: number;
}

const QuotationListScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { selectedOrganization } = useAuth();
  const { showNotification } = useUnifiedNotifications();
  
  // Fetch quotations using Convex
  const quotations = useQuery(
    api.quotations.listQuotations,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Mutations
  const createQuotation = useMutation(api.quotations.createQuotation);
  const updateQuotation = useMutation(api.quotations.updateQuotation);
  const deleteQuotation = useMutation(api.quotations.deleteQuotation);

  // Unified data management
  const { 
    data: localQuotations, 
    setData: setLocalQuotations, 
    isLoading, 
    error,
    refresh 
  } = useUnifiedData<Quotation[]>(
    'quotations',
    quotations || [],
    {
      offlineSupport: true,
      syncOnConnect: true,
    }
  );

  // Filter quotations based on search term
  const filteredQuotations = localQuotations?.filter(quotation =>
    quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handle quotation deletion
  const handleDeleteQuotation = (quotationId: string) => {
    Alert.alert(
      'Delete Quotation',
      'Are you sure you want to delete this quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuotation({ quotation_id: quotationId as any });
              showNotification('Quotation deleted successfully', 'success');
            } catch (error) {
              showNotification('Failed to delete quotation', 'error');
            }
          },
        },
      ]
    );
  };

  // Handle quotation selection
  const handleQuotationPress = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsEditMode(false);
    // TODO: Navigate to quotation detail screen
  };

  // Handle edit quotation
  const handleEditQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsEditMode(true);
    // TODO: Navigate to quotation edit screen
  };

  // Get status color and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return { text: 'Draft', color: '#718096' };
      case 'sent':
        return { text: 'Sent', color: '#3182ce' };
      case 'accepted':
        return { text: 'Accepted', color: '#38a169' };
      case 'rejected':
        return { text: 'Rejected', color: '#e53e3e' };
      case 'expired':
        return { text: 'Expired', color: '#d69e2e' };
      default:
        return { text: 'Unknown', color: '#718096' };
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
  if (quotations === undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quotation Management</Text>
          <Text style={styles.subtitle}>Loading quotations...</Text>
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
          <Text style={styles.title}>Quotation Management</Text>
          <Text style={styles.subtitle}>Please select an organization to view quotations</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No organization selected</Text>
          <Text style={styles.emptySubtext}>
            Please select an organization from the dashboard to manage quotations
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (filteredQuotations.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quotation Management</Text>
          <Text style={styles.subtitle}>
            {searchTerm ? 'No quotations found' : 'No quotations yet'}
          </Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search quotations..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchTerm ? 'No quotations match your search' : 'No quotations created yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Create your first quotation to get started'
            }
          </Text>
        </View>
      </View>
    );
  }

  // Render quotation item
  const renderQuotationItem = ({ item }: { item: Quotation }) => {
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <TouchableOpacity
        style={styles.quotationCard}
        onPress={() => handleQuotationPress(item)}
      >
        <View style={styles.quotationHeader}>
          <View style={styles.quotationInfo}>
            <Text style={styles.quotationNumber}>{item.quotation_number}</Text>
            <Text style={styles.quotationSubject}>{item.subject || 'No subject'}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditQuotation(item)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteQuotation(item._id)}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.quotationDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer:</Text>
            <Text style={styles.detailValue}>{item.customer_name || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issue Date:</Text>
            <Text style={styles.detailValue}>{formatDate(item.issue_date)}</Text>
          </View>
          
          {item.expiry_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry Date:</Text>
              <Text style={styles.detailValue}>{formatDate(item.expiry_date)}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subtotal:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.subtotal)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tax ({item.tax_rate}%):</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.tax_amount)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={[styles.detailValue, styles.totalAmount]}>
              {formatCurrency(item.total_amount)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quotation Management</Text>
        <Text style={styles.subtitle}>
          {filteredQuotations.length} quotation{filteredQuotations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search quotations..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#666"
        />
      </View>

      {/* Quotation List */}
      <FlatList
        data={filteredQuotations}
        renderItem={renderQuotationItem}
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

      {/* Add Quotation Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Create Quotation</Text>
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
  quotationCard: {
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
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quotationInfo: {
    flex: 1,
  },
  quotationNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  quotationSubject: {
    fontSize: 14,
    color: '#718096',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3182ce',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#e53e3e',
  },
  deleteButtonText: {
    color: 'white',
  },
  quotationDetails: {
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

export default QuotationListScreen;
