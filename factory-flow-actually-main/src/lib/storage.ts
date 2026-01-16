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

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
};

export const getUsers = (): Promise<User[]> => request('/api/users');

export const createUser = (user: User): Promise<User> =>
  request('/api/users', { method: 'POST', body: JSON.stringify(user) });

export const updateUser = (user: User): Promise<User> =>
  request(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) });

export const deleteUser = (id: string): Promise<void> =>
  request(`/api/users/${id}`, { method: 'DELETE' });

export const getMaterials = (): Promise<Material[]> => request('/api/materials');

export const createMaterial = (material: Material): Promise<Material> =>
  request('/api/materials', { method: 'POST', body: JSON.stringify(material) });

export const updateMaterial = (material: Material): Promise<Material> =>
  request(`/api/materials/${material.id}`, { method: 'PUT', body: JSON.stringify(material) });

export const deleteMaterial = (id: string): Promise<void> =>
  request(`/api/materials/${id}`, { method: 'DELETE' });

export const getProducts = (): Promise<Product[]> => request('/api/products');

export const createProduct = (product: Product): Promise<Product> =>
  request('/api/products', { method: 'POST', body: JSON.stringify(product) });

export const updateProduct = (product: Product): Promise<Product> =>
  request(`/api/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });

export const deleteProduct = (id: string): Promise<void> =>
  request(`/api/products/${id}`, { method: 'DELETE' });

export const getOrders = (): Promise<Order[]> => request('/api/orders');

export const createOrder = (order: Order): Promise<Order> =>
  request('/api/orders', { method: 'POST', body: JSON.stringify(order) });

export const updateOrder = (order: Order): Promise<Order> =>
  request(`/api/orders/${order.id}`, { method: 'PUT', body: JSON.stringify(order) });

export const deleteOrder = (id: string): Promise<void> =>
  request(`/api/orders/${id}`, { method: 'DELETE' });

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem('manufacturing_current_user');
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('manufacturing_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('manufacturing_current_user');
  }
};

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

export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
