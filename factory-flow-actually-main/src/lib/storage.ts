// Client-side data storage utilities
export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string;
  role: 'admin' | 'manager' | 'employee';
  password: string;
}

export interface Material {
  id: string;
  name: string;
  cost: number;
  unit: string;
  stock: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  materials: { materialId: string; quantity: number }[];
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  products: { productId: string; quantity: number }[];
  status: 'pending' | 'in-progress' | 'completed';
  totalCost: number;
  leftovers: { materialId: string; quantity: number }[];
  createdAt: string;
  completedAt?: string;
}

const STORAGE_KEYS = {
  USERS: 'manufacturing_users',
  MATERIALS: 'manufacturing_materials',
  PRODUCTS: 'manufacturing_products',
  ORDERS: 'manufacturing_orders',
  CURRENT_USER: 'manufacturing_current_user',
};

// Initialize default admin user
export const initializeStorage = () => {
  const users = getUsers();
  if (users.length === 0) {
    const defaultAdmin: User = {
      id: crypto.randomUUID(),
      email: 'admin@company.com',
      name: 'Admin',
      surname: 'User',
      phone: '+370 600 00000',
      role: 'admin',
      password: 'admin123',
    };
    saveUsers([defaultAdmin]);
  }
};

// User operations
export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// Material operations
export const getMaterials = (): Material[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MATERIALS);
  return data ? JSON.parse(data) : [];
};

export const saveMaterials = (materials: Material[]) => {
  localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
};

// Product operations
export const getProducts = (): Product[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return data ? JSON.parse(data) : [];
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

// Order operations
export const getOrders = (): Order[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return data ? JSON.parse(data) : [];
};

export const saveOrders = (orders: Order[]) => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

// Calculate order cost
export const calculateOrderCost = (
  order: Pick<Order, 'products'>,
  products: Product[],
  materials: Material[]
): number => {
  let totalCost = 0;
  
  order.products.forEach(({ productId, quantity }) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      product.materials.forEach(({ materialId, quantity: matQty }) => {
        const material = materials.find(m => m.id === materialId);
        if (material) {
          totalCost += material.cost * matQty * quantity;
        }
      });
    }
  });
  
  return totalCost;
};

// Export to CSV
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
