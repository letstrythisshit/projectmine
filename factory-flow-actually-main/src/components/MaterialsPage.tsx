import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getMaterials, saveMaterials, Material, exportToCSV } from '@/lib/storage';
import { Plus, Search, ArrowUpDown, Pencil, Trash2, FileDown } from 'lucide-react';

export const MaterialsPage = () => {
  const [materials, setMaterials] = useState<Material[]>(getMaterials());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    unit: '',
    stock: '',
  });

  const filteredAndSortedMaterials = useMemo(() => {
    let filtered = materials.filter(material =>
      material.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'cost') {
        comparison = a.cost - b.cost;
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [materials, searchQuery, sortBy, sortOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const materialData: Material = editingMaterial
      ? { ...editingMaterial, ...formData, cost: parseFloat(formData.cost), stock: parseFloat(formData.stock) }
      : {
          id: crypto.randomUUID(),
          name: formData.name,
          cost: parseFloat(formData.cost),
          unit: formData.unit,
          stock: parseFloat(formData.stock),
          createdAt: new Date().toISOString(),
        };

    const updatedMaterials = editingMaterial
      ? materials.map(m => m.id === editingMaterial.id ? materialData : m)
      : [...materials, materialData];

    setMaterials(updatedMaterials);
    saveMaterials(updatedMaterials);

    toast({
      title: editingMaterial ? 'Material updated' : 'Material created',
      description: `${materialData.name} has been ${editingMaterial ? 'updated' : 'added'} successfully.`,
    });

    setFormData({ name: '', cost: '', unit: '', stock: '' });
    setEditingMaterial(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const updatedMaterials = materials.filter(m => m.id !== id);
    setMaterials(updatedMaterials);
    saveMaterials(updatedMaterials);
    toast({ title: 'Material deleted', description: 'Material has been removed successfully.' });
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      cost: material.cost.toString(),
      unit: material.unit,
      stock: material.stock.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    const exportData = materials.map(m => ({
      Name: m.name,
      Cost: m.cost,
      Unit: m.unit,
      Stock: m.stock,
      'Created Date': new Date(m.createdAt).toLocaleDateString(),
    }));
    exportToCSV(exportData, 'materials');
    toast({ title: 'Export successful', description: 'Materials data has been exported to CSV.' });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Materials</h1>
          <p className="text-muted-foreground">Manage your manufacturing materials inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingMaterial(null);
              setFormData({ name: '', cost: '', unit: '', stock: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Material Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Cotton Fabric"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost per Unit (€)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., meters"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    step="0.01"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingMaterial ? 'Update Material' : 'Add Material'}
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
                placeholder="Search materials..."
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
        {filteredAndSortedMaterials.map((material) => (
          <Card key={material.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{material.name}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(material)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(material.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cost per {material.unit}:</span>
                  <span className="font-medium">€{material.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Stock:</span>
                  <span className={`font-medium ${material.stock < 100 ? 'text-destructive' : ''}`}>
                    {material.stock} {material.unit}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                  Added: {new Date(material.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedMaterials.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No materials found. Add your first material to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
