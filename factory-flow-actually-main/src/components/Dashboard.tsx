import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrders, getMaterials, getProducts, Material, Order, Product } from '@/lib/storage';
import { ShoppingCart, Package, Box, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [orderData, materialData, productData] = await Promise.all([
        getOrders(),
        getMaterials(),
        getProducts(),
      ]);
      setOrders(orderData);
      setMaterials(materialData);
      setProducts(productData);
    };

    loadData();
  }, []);

  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalCost, 0);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const inProgressOrders = orders.filter(o => o.status === 'in-progress').length;

  const stats = [
    {
      title: 'Total Orders',
      value: orders.length,
      icon: ShoppingCart,
      description: `${pendingOrders} pending, ${inProgressOrders} in progress`,
    },
    {
      title: 'Total Products',
      value: products.length,
      icon: Package,
      description: 'Active product catalog',
    },
    {
      title: 'Materials in Stock',
      value: materials.length,
      icon: Box,
      description: 'Available materials',
    },
    {
      title: 'Total Revenue',
      value: `€${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      description: 'Completed orders',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your manufacturing operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.slice(-5).reverse().map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">€{order.totalCost.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Materials</CardTitle>
          </CardHeader>
          <CardContent>
            {materials
              .filter(m => m.stock < 100)
              .slice(0, 5)
              .map((material) => (
                <div key={material.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{material.name}</p>
                    <p className="text-sm text-muted-foreground">{material.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{material.stock}</p>
                    <p className="text-xs text-destructive">Low stock</p>
                  </div>
                </div>
              ))}
            {materials.filter(m => m.stock < 100).length === 0 && (
              <p className="text-center text-muted-foreground py-8">All materials well stocked</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
