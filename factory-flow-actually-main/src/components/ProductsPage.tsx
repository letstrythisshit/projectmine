import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getProducts, saveProducts, getMaterials, Product, exportToCSV } from '@/lib/storage';
import { Plus, Search, ArrowUpDown, Pencil, Trash2, FileDown } from 'lucide-react';

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>(getProducts());
  const materials = getMaterials();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    materials: [] as { materialId: string; quantity: number }[],
  });

  const calculateProductCost = (productMaterials: { materialId: string; quantity: number }[]) => {
    return productMaterials.reduce((sum, pm) => {
      const material = materials.find(m => m.id === pm.materialId);
      return sum + (material ? material.cost * pm.quantity : 0);
    }, 0);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'cost') {
        const costA = calculateProductCost(a.materials);
        const costB = calculateProductCost(b.materials);
        comparison = costA - costB;
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [products, searchQuery, sortBy, sortOrder, materials]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.materials.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one material to the product.',
        variant: 'destructive',
      });
      return;
    }

    const productData: Product = editingProduct
      ? { ...editingProduct, ...formData }
      : {
          id: crypto.randomUUID(),
          name: formData.name,
          materials: formData.materials,
          createdAt: new Date().toISOString(),
        };

    const updatedProducts = editingProduct
      ? products.map(p => p.id === editingProduct.id ? productData : p)
      : [...products, productData];

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    toast({
      title: editingProduct ? 'Product updated' : 'Product created',
      description: `${productData.name} has been ${editingProduct ? 'updated' : 'added'} successfully.`,
    });

    setFormData({ name: '', materials: [] });
    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    toast({ title: 'Product deleted', description: 'Product has been removed successfully.' });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      materials: product.materials,
    });
    setIsDialogOpen(true);
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      materials: [...formData.materials, { materialId: '', quantity: 0 }],
    });
  };

  const removeMaterial = (index: number) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter((_, i) => i !== index),
    });
  };

  const updateMaterial = (index: number, field: 'materialId' | 'quantity', value: string | number) => {
    const updated = [...formData.materials];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, materials: updated });
  };

  const handleExport = () => {
    const exportData = products.map(p => ({
      Name: p.name,
      'Material Count': p.materials.length,
      'Total Cost': calculateProductCost(p.materials).toFixed(2),
      'Created Date': new Date(p.createdAt).toLocaleDateString(),
    }));
    exportToCSV(exportData, 'products');
    toast({ title: 'Export successful', description: 'Products data has been exported to CSV.' });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingProduct(null);
              setFormData({ name: '', materials: [] });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., T-Shirt"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Materials Required</Label>
                    <Button type="button" size="sm" onClick={addMaterial}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Material
                    </Button>
                  </div>

                  {formData.materials.map((mat, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select
                          value={mat.materialId}
                          onValueChange={(value) => updateMaterial(index, 'materialId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.name} (€{material.cost}/{material.unit})
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
                          value={mat.quantity}
                          onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeMaterial(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {formData.materials.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No materials added yet. Click "Add Material" to start.
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  {editingProduct ? 'Update Product' : 'Add Product'}
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
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (sortBy === 'date') setSortBy('cost');
                else if (sortBy === 'cost') setSortBy('name');
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedProducts.map((product) => {
          const totalCost = calculateProductCost(product.materials);
          return (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{product.name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Production Cost:</span>
                    <span className="font-medium">€{totalCost.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-sm font-medium mb-1">Materials:</p>
                    {product.materials.map((pm) => {
                      const material = materials.find(m => m.id === pm.materialId);
                      return material ? (
                        <div key={pm.materialId} className="text-xs text-muted-foreground">
                          {material.name}: {pm.quantity} {material.unit}
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    Added: {new Date(product.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAndSortedProducts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No products found. Add your first product to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
