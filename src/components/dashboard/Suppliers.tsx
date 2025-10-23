import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Truck, Plus, Trash2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { AppState } from '../../App';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  itemsProvided: string;
  notes?: string;
  createdAt: string;
}

interface SuppliersProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export function Suppliers({ appState, setAppState }: SuppliersProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    itemsProvided: '',
    notes: ''
  });

  useEffect(() => {
    const savedSuppliers = localStorage.getItem('buziz-suppliers');
    if (savedSuppliers) {
      setSuppliers(JSON.parse(savedSuppliers));
    }
  }, []);

  const saveSuppliers = (newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
    localStorage.setItem('buziz-suppliers', JSON.stringify(newSuppliers));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.contactPerson || !formData.itemsProvided) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newSupplier: Supplier = {
      id: crypto.randomUUID(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    saveSuppliers([...suppliers, newSupplier]);
    toast.success('Supplier added successfully');
    setDialogOpen(false);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      itemsProvided: '',
      notes: ''
    });
  };

  const handleDelete = (id: string) => {
    saveSuppliers(suppliers.filter(s => s.id !== id));
    toast.success('Supplier removed');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Supplier Management</h1>
          <p className="text-gray-600">Manage your business suppliers and contacts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ABC Supplies Co."
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Primary contact name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@supplier.com"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="itemsProvided">Items/Services Provided</Label>
                <Input
                  id="itemsProvided"
                  value={formData.itemsProvided}
                  onChange={(e) => setFormData({ ...formData, itemsProvided: e.target.value })}
                  placeholder="e.g., Office supplies, Furniture"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-black text-white hover:bg-gray-800">
                  Add Supplier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {suppliers.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">No suppliers added</h3>
          <p className="text-gray-600 mb-4">Add your first supplier to keep track of business contacts</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {suppliers.map(supplier => (
            <Card key={supplier.id} className="p-6 border-2 border-black">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-black mb-1">{supplier.name}</h4>
                    <p className="text-gray-600 text-sm">{supplier.contactPerson}</p>
                  </div>
                </div>
                {(appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(supplier.id)}
                    className="text-gray-400 hover:text-black"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${supplier.email}`} className="hover:text-black">
                      {supplier.email}
                    </a>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${supplier.phone}`} className="hover:text-black">
                      {supplier.phone}
                    </a>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-600 text-sm mb-1">Provides:</p>
                  <p className="text-black text-sm">{supplier.itemsProvided}</p>
                </div>
                {supplier.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-600 text-sm mb-1">Notes:</p>
                    <p className="text-black text-sm">{supplier.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
