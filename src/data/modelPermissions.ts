// Model-specific permissions for modular access control
export const AVAILABLE_MODELS = [
  {
    name: 'customers',
    label: 'Customers',
    description: 'Customer management and CRM',
    permissions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'leads',
    label: 'Leads',
    description: 'Lead management and tracking',
    permissions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'inventory',
    label: 'Inventory',
    description: 'Product and stock management',
    permissions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'suppliers',
    label: 'Suppliers',
    description: 'Supplier and vendor management',
    permissions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'quotations',
    label: 'Quotations',
    description: 'Quote and proposal management',
    permissions: ['read', 'create', 'update', 'delete', 'approve']
  },
  {
    name: 'delivery_notes',
    label: 'Delivery Notes',
    description: 'Delivery note and shipping management',
    permissions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'process_flows',
    label: 'Process Flows',
    description: 'Workflow and process management',
    permissions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'settings',
    label: 'Settings',
    description: 'System configuration and settings',
    permissions: ['read', 'update']
  },
  {
    name: 'reports',
    label: 'Reports',
    description: 'Analytics and reporting',
    permissions: ['read']
  },
  {
    name: 'profit_sharing',
    label: 'Profit Sharing',
    description: 'Profit sharing and partner management',
    permissions: ['read', 'create', 'update', 'delete', 'approve']
  }
];

export const SYSTEM_PERMISSIONS = [
  { value: 'read', label: 'Read - View data and reports' },
  { value: 'create', label: 'Create - Add new records' },
  { value: 'update', label: 'Update - Edit existing records' },
  { value: 'delete', label: 'Delete - Remove records' },
  { value: 'approve', label: 'Approve - Approve transactions and requests' },
  { value: 'manage_users', label: 'Manage Users - User administration' },
  { value: 'manage_system', label: 'Manage System - Full system control' }
];

// Helper function to get default permissions for a role
export const getDefaultPermissionsForRole = (role: string) => {
  switch (role.toLowerCase()) {
    case 'super_admin':
      return {
        systemPermissions: ['read', 'create', 'update', 'delete', 'approve', 'manage_users', 'manage_system'],
        modelPermissions: AVAILABLE_MODELS.map(model => ({
          model: model.name,
          permissions: model.permissions
        }))
      };
    case 'admin':
      return {
        systemPermissions: ['read', 'create', 'update', 'delete', 'approve', 'manage_users'],
        modelPermissions: AVAILABLE_MODELS.map(model => ({
          model: model.name,
          permissions: model.permissions
        }))
      };
    case 'manager':
      return {
        systemPermissions: ['read', 'create', 'update', 'approve'],
        modelPermissions: AVAILABLE_MODELS.map(model => ({
          model: model.name,
          permissions: ['read', 'create', 'update', 'approve'].filter(p => model.permissions.includes(p))
        }))
      };
    case 'user':
      return {
        systemPermissions: ['read', 'create', 'update'],
        modelPermissions: AVAILABLE_MODELS.map(model => ({
          model: model.name,
          permissions: ['read', 'create', 'update'].filter(p => model.permissions.includes(p))
        }))
      };
    case 'viewer':
      return {
        systemPermissions: ['read'],
        modelPermissions: AVAILABLE_MODELS.map(model => ({
          model: model.name,
          permissions: ['read']
        }))
      };
    default:
      return {
        systemPermissions: ['read'],
        modelPermissions: AVAILABLE_MODELS.map(model => ({
          model: model.name,
          permissions: ['read']
        }))
      };
  }
};
