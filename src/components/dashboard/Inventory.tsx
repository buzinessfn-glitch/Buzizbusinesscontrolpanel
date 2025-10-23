import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Package, Plus, Trash2, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { AppState } from '../../App';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  supplier?: string;
  lastUpdated: string;
}

interface InventoryProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export function Inventory({ appState, setAppState }: InventoryProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: 'units',
    lowStockThreshold: '10',
    supplier: ''
  });

  useEffect(() => {
    const savedItems = localStorage.getItem('buziz-inventory');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  const saveItems = (newItems: InventoryItem[]) => {
    setItems(newItems);
    localStorage.setItem('buziz-inventory', JSON.stringify(newItems));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: formData.name,
      category: formData.category,
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      lowStockThreshold: parseInt(formData.lowStockThreshold),
      supplier: formData.supplier,
      lastUpdated: new Date().toISOString()
    };

    saveItems([...items, newItem]);
    toast.success('Inventory item added');
    setDialogOpen(false);
    setFormData({
      name: '',
      category: '',
      quantity: '',
      unit: 'units',
      lowStockThreshold: '10',
      supplier: ''
    });
  };

  const handleAdjustQuantity = () => {
    if (!selectedItem || !adjustAmount) {
      toast.error('Please enter an amount');
      return;
    }

    const amount = parseInt(adjustAmount);
    const newQuantity = adjustType === 'add' 
      ? selectedItem.quantity + amount 
      : Math.max(0, selectedItem.quantity - amount);

    saveItems(items.map(item => 
      item.id === selectedItem.id 
        ? { ...item, quantity: newQuantity, lastUpdated: new Date().toISOString() }
        : item
    ));

    toast.success(`Quantity ${adjustType === 'add' ? 'added' : 'removed'}`);
    setAdjustDialogOpen(false);
    setSelectedItem(null);
    setAdjustAmount('');
  };

  const handleDelete = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
    toast.success('Item removed from inventory');
  };

  const openAdjustDialog = (item: InventoryItem, type: 'add' | 'remove') => {
    setSelectedItem(item);
    setAdjustType(type);
    setAdjustDialogOpen(true);
  };

  const lowStockItems = items.filter(item => item.quantity <= item.lowStockThreshold);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Inventory Management</h1>
          <p className="text-gray-600">Track stock levels and supplies</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Printer Paper"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Office Supplies"
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="100"
                    className="mt-1.5"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="units, boxes, kg"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Alert Level</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  placeholder="10"
                  className="mt-1.5"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="supplier">Supplier (Optional)</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name"
                  className="mt-1.5"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-black text-white hover:bg-gray-800">
                  Add Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="p-4 border-2 border-black bg-gray-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-black mb-1">Low Stock Alert</p>
              <p className="text-gray-600 text-sm">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's are' : ' is'} below the threshold
              </p>
            </div>
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">No inventory items</h3>
          <p className="text-gray-600 mb-4">Add your first item to start tracking inventory</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <Card key={item.id} className="p-4 border-2 border-black">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-black">{item.name}</h4>
                    {item.quantity <= item.lowStockThreshold && (
                      <Badge className="bg-black text-white">Low Stock</Badge>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{item.category}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Current stock: <span className="text-black">{item.quantity} {item.unit}</span></p>
                    <p>Alert threshold: {item.lowStockThreshold} {item.unit}</p>
                    {item.supplier && <p>Supplier: {item.supplier}</p>}
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {(appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-400 hover:text-black"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAdjustDialog(item, 'add')}
                  className="flex-1"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Add Stock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAdjustDialog(item, 'remove')}
                  className="flex-1"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Remove Stock
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Adjust Quantity Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {adjustType === 'add' ? 'Add' : 'Remove'} Stock
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item</Label>
              <p className="text-black mt-1.5">{selectedItem?.name}</p>
            </div>
            <div>
              <Label>Current Quantity</Label>
              <p className="text-black mt-1.5">{selectedItem?.quantity} {selectedItem?.unit}</p>
            </div>
            <div>
              <Label htmlFor="adjustAmount">Amount to {adjustType}</Label>
              <Input
                id="adjustAmount"
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1.5"
                min="1"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setAdjustDialogOpen(false);
                  setSelectedItem(null);
                  setAdjustAmount('');
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAdjustQuantity} 
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
