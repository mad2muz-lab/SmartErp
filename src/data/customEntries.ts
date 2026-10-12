// Custom entries management for inventory form
export interface CustomEntry {
  id: string;
  value: string;
  type: 'category' | 'unit' | 'supplier' | 'customer' | 'inventory_item' | 'payment_terms' | 'department';
  organization_id: string;
  created_at: string;
  usage_count: number;
}

// Local storage keys
const CUSTOM_CATEGORIES_KEY = 'custom_categories';
const CUSTOM_UNITS_KEY = 'custom_units';
const CUSTOM_SUPPLIERS_KEY = 'custom_suppliers';
const CUSTOM_CUSTOMERS_KEY = 'custom_customers';
const CUSTOM_INVENTORY_ITEMS_KEY = 'custom_inventory_items';
const CUSTOM_PAYMENT_TERMS_KEY = 'custom_payment_terms';
const CUSTOM_DEPARTMENTS_KEY = 'custom_departments';

// Get custom entries from local storage
export const getCustomEntries = (type: 'category' | 'unit' | 'supplier' | 'customer' | 'inventory_item' | 'payment_terms' | 'department', organization_id: string): string[] => {
  const key = type === 'category' ? CUSTOM_CATEGORIES_KEY : 
              type === 'unit' ? CUSTOM_UNITS_KEY : 
              type === 'supplier' ? CUSTOM_SUPPLIERS_KEY :
              type === 'customer' ? CUSTOM_CUSTOMERS_KEY :
              type === 'inventory_item' ? CUSTOM_INVENTORY_ITEMS_KEY :
              type === 'department' ? CUSTOM_DEPARTMENTS_KEY :
              CUSTOM_PAYMENT_TERMS_KEY;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const entries: CustomEntry[] = JSON.parse(stored);
      return entries
        .filter(entry => entry.organization_id === organization_id)
        .sort((a, b) => b.usage_count - a.usage_count)
        .map(entry => entry.value);
    }
  } catch (error) {
    console.error(`Error loading custom ${type}s:`, error);
  }
  return [];
};

// Add custom entry to local storage
export const addCustomEntry = (type: 'category' | 'unit' | 'supplier' | 'customer' | 'inventory_item' | 'payment_terms' | 'department', value: string, organization_id: string): void => {
  const key = type === 'category' ? CUSTOM_CATEGORIES_KEY : 
              type === 'unit' ? CUSTOM_UNITS_KEY : 
              type === 'supplier' ? CUSTOM_SUPPLIERS_KEY :
              type === 'customer' ? CUSTOM_CUSTOMERS_KEY :
              type === 'inventory_item' ? CUSTOM_INVENTORY_ITEMS_KEY :
              type === 'department' ? CUSTOM_DEPARTMENTS_KEY :
              CUSTOM_PAYMENT_TERMS_KEY;
  
  try {
    const stored = localStorage.getItem(key);
    const entries: CustomEntry[] = stored ? JSON.parse(stored) : [];
    
    // Check if entry already exists
    const existingIndex = entries.findIndex(entry => 
      entry.value.toLowerCase() === value.toLowerCase() && 
      entry.organization_id === organization_id
    );
    
    if (existingIndex >= 0) {
      // Increment usage count
      entries[existingIndex].usage_count += 1;
    } else {
      // Add new entry
      entries.push({
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        value: value.trim(),
        type,
        organization_id,
        created_at: new Date().toISOString(),
        usage_count: 1
      });
    }
    
    localStorage.setItem(key, JSON.stringify(entries));
  } catch (error) {
    console.error(`Error saving custom ${type}:`, error);
  }
};

// Get all entries (predefined + custom) for a type
export const getAllEntries = (
  type: 'category' | 'unit' | 'supplier' | 'customer' | 'inventory_item' | 'payment_terms' | 'department',
  organization_id: string,
  predefinedList: string[]
): string[] => {
  const customEntries = getCustomEntries(type, organization_id);
  const allEntries = [...predefinedList, ...customEntries];
  
  // Remove duplicates and sort
  return [...new Set(allEntries)].sort((a, b) => {
    // Put predefined items first, then custom items
    const aIsPredefined = predefinedList.includes(a);
    const bIsPredefined = predefinedList.includes(b);
    
    if (aIsPredefined && !bIsPredefined) return -1;
    if (!aIsPredefined && bIsPredefined) return 1;
    
    return a.localeCompare(b);
  });
};

// Filter entries based on search term
export const filterEntries = (entries: string[], searchTerm: string): string[] => {
  if (!searchTerm.trim()) return entries;
  
  const term = searchTerm.toLowerCase();
  return entries.filter(entry => 
    entry && entry.toLowerCase().includes(term) ||
    entry && entry.toLowerCase().startsWith(term)
  );
};
