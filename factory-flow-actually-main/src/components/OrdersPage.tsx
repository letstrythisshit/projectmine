import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createOrder, deleteOrder, getOrders, getProducts, getMaterials, Material, Order, Product, updateOrder, exportToCSV, calculateOrderCost } from '@/lib/storage';
import { Plus, Search, ArrowUpDown, Pencil, Trash2, FileDown } from 'lucide-react';

export const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'number' | 'cost' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    orderNumber: '',
    products: [] as { productId: string; quantity: number }[],
    status: 'pending' as 'pending' | 'in-progress' | 'completed',
    leftovers: [] as { materialId: string; quantity: number }[],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderData, productData, materialData] = await Promise.all([
          getOrders(),
          getProducts(),
          getMaterials(),
        ]);
        setOrders(orderData);
        setProducts(productData);
        setMaterials(materialData);
      } catch (error) {
        toast({
          title: 'Unable to load data',
          description: error instanceof Error ? error.message : 'Server error',
          variant: 'destructive',
        });
      }
    };

    loadData();
  }, [toast]);

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order =>
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'number') {
        comparison = a.orderNumber.localeCompare(b.orderNumber);
      } else if (sortBy === 'cost') {
        comparison = a.totalCost - b.totalCost;
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [orders, searchQuery, sortBy, sortOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.products.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one product to the order.',
        variant: 'destructive',
      });
      return;
    }

    const totalCost = calculateOrderCost({ products: formData.products }, products, materials);

    const orderData: Order = editingOrder
      ? { 
          ...editingOrder, 
          ...formData,
          totalCost,
          completedAt: formData.status === 'completed' ? new Date().toISOString() : editingOrder.completedAt,
        }
      : {
          id: crypto.randomUUID(),
          orderNumber: formData.orderNumber,
          products: formData.products,
          status: formData.status,
          totalCost,
          leftovers: formData.leftovers,
          createdAt: new Date().toISOString(),
          completedAt: formData.status === 'completed' ? new Date().toISOString() : undefined,
        };

    try {
      if (editingOrder) {
        const saved = await updateOrder(orderData);
        setOrders(orders.map(o => (o.id === saved.id ? saved : o)));
        toast({
          title: 'Order updated',
          description: `Order ${saved.orderNumber} has been updated successfully.`,
        });
      } else {
        const saved = await createOrder(orderData);
        setOrders([...orders, saved]);
        toast({
          title: 'Order created',
          description: `Order ${saved.orderNumber} has been created successfully.`,
        });
      }

      setFormData({ orderNumber: '', products: [], status: 'pending', leftovers: [] });
      setEditingOrder(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Unable to save order',
        description: error instanceof Error ? error.message : 'Server error',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrder(id);
      setOrders(orders.filter(o => o.id !== id));
      toast({ title: 'Order deleted', description: 'Order has been removed successfully.' });
    } catch (error) {
      toast({
        title: 'Unable to delete order',
        description: error instanceof Error ? error.message : 'Server error',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      orderNumber: order.orderNumber,
      products: order.products,
      status: order.status,
      leftovers: order.leftovers,
    });
    setIsDialogOpen(true);
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { productId: '', quantity: 0 }],
    });
  };

  const removeProduct = (index: number) => {
    setFormData({
      ...formData,
      products: formData.products.filter((_, i) => i !== index),
    });
  };

  const updateProduct = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const updated = [...formData.products];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, products: updated });
  };

  const addLeftover = () => {
    setFormData({
      ...formData,
      leftovers: [...formData.leftovers, { materialId: '', quantity: 0 }],
    });
  };

  const removeLeftover = (index: number) => {
    setFormData({
      ...formData,
      leftovers: formData.leftovers.filter((_, i) => i !== index),
    });
  };

  const updateLeftover = (index: number, field: 'materialId' | 'quantity', value: string | number) => {
    const updated = [...formData.leftovers];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, leftovers: updated });
  };

  const handleExport = () => {
    const exportData = orders.map(o => ({
      'Order Number': o.orderNumber,
      'Status': o.status,
      'Total Cost': o.totalCost.toFixed(2),
      'Product Count': o.products.length,
      'Created Date': new Date(o.createdAt).toLocaleDateString(),
      'Completed Date': o.completedAt ? new Date(o.completedAt).toLocaleDateString() : 'N/A',
    }));
    exportToCSV(exportData, 'orders');
    toast({ title: 'Export successful', description: 'Orders data has been exported to CSV.' });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage manufacturing orders</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingOrder(null);
              setFormData({ orderNumber: '', products: [], status: 'pending', leftovers: [] });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrder ? 'Edit Order' : 'Create New Order'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Order Number</Label>
                    <Input
                      id="orderNumber"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                      placeholder="e.g., ORD-2024-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Products</Label>
                    <Button type="button" size="sm" onClick={addProduct}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Product
                    </Button>
                  </div>

                  {formData.products.map((prod, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select
                          value={prod.productId}
                          onValueChange={(value) => updateProduct(index, 'productId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={prod.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeProduct(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Leftovers (Optional)</Label>
                    <Button type="button" size="sm" onClick={addLeftover} variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Leftover
                    </Button>
                  </div>

                  {formData.leftovers.map((leftover, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select
                          value={leftover.materialId}
                          onValueChange={(value) => updateLeftover(index, 'materialId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Quantity"
                          value={leftover.quantity}
                          onChange={(e) => updateLeftover(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeLeftover(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full">
                  {editingOrder ? 'Update Order' : 'Create Order'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (sortBy === 'date') setSortBy('cost');
                else if (sortBy === 'cost') setSortBy('number');
                else setSortBy('date');
              }}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort by: {sortBy}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredAndSortedOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div>
                  <span>{order.orderNumber}</span>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(order)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(order.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Products:</p>
                  {order.products.map((op) => {
                    const product = products.find(p => p.id === op.productId);
                    return product ? (
                      <div key={op.productId} className="text-sm text-muted-foreground">
                        {product.name} × {op.quantity}
                      </div>
                    ) : null;
                  })}
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Cost:</span>
                    <span className="font-bold text-lg">€{order.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  {order.completedAt && (
                    <div className="text-xs text-muted-foreground">
                      Completed: {new Date(order.completedAt).toLocaleDateString()}
                    </div>
                  )}
                  {order.leftovers.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium">Leftovers:</p>
                      {order.leftovers.map((lo) => {
                        const material = materials.find(m => m.id === lo.materialId);
                        return material ? (
                          <div key={lo.materialId} className="text-xs text-muted-foreground">
                            {material.name}: {lo.quantity} {material.unit}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedOrders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No orders found. Create your first order to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
