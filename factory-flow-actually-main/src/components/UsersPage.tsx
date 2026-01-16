import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createUser, deleteUser, getUsers, getCurrentUser, updateUser, User } from '@/lib/storage';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';

export const UsersPage = () => {
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    surname: '',
    phone: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    password: '',
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        toast({
          title: 'Unable to load users',
          description: error instanceof Error ? error.message : 'Server error',
          variant: 'destructive',
        });
      }
    };

    loadUsers();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.includes('@')) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6 && !editingUser) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    const userData: User = editingUser
      ? { ...editingUser, ...formData, password: formData.password || editingUser.password }
      : {
          id: crypto.randomUUID(),
          ...formData,
        };

    try {
      if (editingUser) {
        const saved = await updateUser(userData);
        setUsers(users.map(u => (u.id === saved.id ? saved : u)));
        toast({
          title: 'User updated',
          description: `${saved.name} ${saved.surname} has been updated successfully.`,
        });
      } else {
        const saved = await createUser(userData);
        setUsers([...users, saved]);
        toast({
          title: 'User created',
          description: `${saved.name} ${saved.surname} has been added successfully.`,
        });
      }

      setFormData({ email: '', name: '', surname: '', phone: '', role: 'employee', password: '' });
      setEditingUser(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Unable to save user',
        description: error instanceof Error ? error.message : 'Server error',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      toast({
        title: 'Cannot delete',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      toast({ title: 'User deleted', description: 'User has been removed successfully.' });
    } catch (error) {
      toast({
        title: 'Unable to delete user',
        description: error instanceof Error ? error.message : 'Server error',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      surname: user.surname,
      phone: user.phone,
      role: user.role,
      password: '',
    });
    setIsDialogOpen(true);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access user management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and roles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            setFormData({ email: '', name: '', surname: '', phone: '', role: 'employee', password: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname</Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+370 600 00000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingUser && '(leave blank to keep current)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingUser ? 'Update User' : 'Add User'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div>
                  <span>{user.name} {user.surname}</span>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {user.id !== currentUser?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">Phone:</span>
                  <span>{user.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
