import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Camera, Plus, Maximize2, RefreshCw, Wifi, WifiOff, Bluetooth, Cable, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState } from '../../App';

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  type: 'wireless' | 'wired' | 'bluetooth';
  streamUrl: string;
  status: 'online' | 'offline';
  addedBy: string;
  addedAt: string;
}

interface SecurityCamerasProps {
  appState: AppState;
}

export function SecurityCameras({ appState }: SecurityCamerasProps) {
  const [cameras, setCameras] = useState<CameraFeed[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fullscreenCamera, setFullscreenCamera] = useState<CameraFeed | null>(null);
  const [cameraName, setCameraName] = useState('');
  const [cameraLocation, setCameraLocation] = useState('');
  const [cameraType, setCameraType] = useState<'wireless' | 'wired' | 'bluetooth'>('wireless');
  const [streamUrl, setStreamUrl] = useState('');

  const canManage = appState.currentEmployee?.isCreator || 
                     appState.currentEmployee?.isHeadManager ||
                     appState.roles.find(r => r.name === appState.currentEmployee?.role)?.permissions.includes('all');

  useEffect(() => {
    loadCameras();
    const interval = setInterval(checkCameraStatus, 10000); // Check status every 10s
    return () => clearInterval(interval);
  }, [appState.office]);

  const loadCameras = async () => {
    if (!appState.office) return;
    
    try {
      const data = await getData(appState.office.id, 'security-cameras');
      setCameras(data.data || []);
    } catch (error) {
      console.error('Error loading cameras:', error);
    }
  };

  const checkCameraStatus = async () => {
    // In production, this would ping the camera streams
    // For now, randomly simulate status (demo purposes)
    setCameras(prev => prev.map(cam => ({
      ...cam,
      status: Math.random() > 0.1 ? 'online' : 'offline'
    })));
  };

  const handleAddCamera = async () => {
    if (!appState.office || !appState.currentEmployee || !cameraName || !streamUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newCamera: CameraFeed = {
        id: crypto.randomUUID(),
        name: cameraName,
        location: cameraLocation,
        type: cameraType,
        streamUrl: streamUrl,
        status: 'online',
        addedBy: appState.currentEmployee.name,
        addedAt: new Date().toISOString()
      };

      const updated = [...cameras, newCamera];
      await updateData(appState.office.id, 'security-cameras', updated);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Security Camera Added',
        `${cameraName} at ${cameraLocation}`,
        'admin'
      );

      toast.success('Camera added successfully');
      setDialogOpen(false);
      resetForm();
      loadCameras();
    } catch (error) {
      console.error('Error adding camera:', error);
      toast.error('Failed to add camera');
    }
  };

  const handleRemoveCamera = async (cameraId: string) => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      const camera = cameras.find(c => c.id === cameraId);
      const updated = cameras.filter(c => c.id !== cameraId);
      await updateData(appState.office.id, 'security-cameras', updated);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Security Camera Removed',
        `${camera?.name}`,
        'admin'
      );

      toast.success('Camera removed');
      loadCameras();
    } catch (error) {
      console.error('Error removing camera:', error);
    }
  };

  const resetForm = () => {
    setCameraName('');
    setCameraLocation('');
    setCameraType('wireless');
    setStreamUrl('');
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'wireless':
        return <Wifi className="w-4 h-4" />;
      case 'bluetooth':
        return <Bluetooth className="w-4 h-4" />;
      case 'wired':
        return <Cable className="w-4 h-4" />;
      default:
        return <Camera className="w-4 h-4" />;
    }
  };

  const onlineCameras = cameras.filter(c => c.status === 'online').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1 flex items-center gap-2">
            <Camera className="w-6 h-6" />
            Security Cameras
          </h1>
          <p className="text-gray-600">Monitor security camera feeds in real-time</p>
        </div>
        {canManage && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Camera
          </Button>
        )}
      </div>

      {/* Camera Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 border-2 border-blue-500">
          <div className="text-center">
            <Camera className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{cameras.length}</p>
            <p className="text-sm text-gray-600">Total Cameras</p>
          </div>
        </Card>
        <Card className="p-6 border-2 border-green-500">
          <div className="text-center">
            <Wifi className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{onlineCameras}</p>
            <p className="text-sm text-gray-600">Online</p>
          </div>
        </Card>
        <Card className="p-6 border-2 border-red-500">
          <div className="text-center">
            <WifiOff className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{cameras.length - onlineCameras}</p>
            <p className="text-sm text-gray-600">Offline</p>
          </div>
        </Card>
      </div>

      {/* Camera Grid */}
      {cameras.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">No Cameras Added</h3>
          <p className="text-gray-600">Add security cameras to start monitoring</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map(camera => (
            <Card
              key={camera.id}
              className={`overflow-hidden border-2 ${
                camera.status === 'online' ? 'border-green-500' : 'border-red-500'
              }`}
            >
              {/* Camera Feed Preview */}
              <div className="relative bg-gray-900 aspect-video">
                {camera.streamUrl.startsWith('http') ? (
                  <img
                    src={camera.streamUrl}
                    alt={camera.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23111" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23666" font-size="20">No Feed</text></svg>';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Camera className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                <Badge
                  className={`absolute top-2 right-2 ${
                    camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  } text-white`}
                >
                  {camera.status === 'online' ? 'Live' : 'Offline'}
                </Badge>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-2 right-2"
                  onClick={() => setFullscreenCamera(camera)}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Camera Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-black mb-1">{camera.name}</h4>
                    <p className="text-sm text-gray-600">{camera.location}</p>
                  </div>
                  {canManage && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveCamera(camera.id)}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {getConnectionIcon(camera.type)}
                  <span className="text-gray-600 capitalize">{camera.type}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Camera Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Security Camera</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Camera Name *</Label>
              <Input
                value={cameraName}
                onChange={(e) => setCameraName(e.target.value)}
                placeholder="e.g., Front Entrance"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={cameraLocation}
                onChange={(e) => setCameraLocation(e.target.value)}
                placeholder="e.g., Main Lobby"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Connection Type</Label>
              <Select value={cameraType} onValueChange={(v: any) => setCameraType(v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wireless">Wireless (WiFi)</SelectItem>
                  <SelectItem value="wired">Wired (Ethernet)</SelectItem>
                  <SelectItem value="bluetooth">Bluetooth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stream URL *</Label>
              <Input
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="http://camera-ip:port/stream or image URL"
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter camera stream URL or a static image URL for testing
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAddCamera} className="flex-1 bg-black text-white">
                Add Camera
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Camera Dialog */}
      <Dialog open={!!fullscreenCamera} onOpenChange={() => setFullscreenCamera(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {fullscreenCamera?.name}
              <Badge className={fullscreenCamera?.status === 'online' ? 'bg-green-500' : 'bg-red-500'}>
                {fullscreenCamera?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="relative bg-gray-900 aspect-video rounded-lg overflow-hidden">
            {fullscreenCamera?.streamUrl.startsWith('http') ? (
              <img
                src={fullscreenCamera.streamUrl}
                alt={fullscreenCamera.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Camera className="w-24 h-24 text-gray-600" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{fullscreenCamera?.location}</span>
            <div className="flex items-center gap-2">
              {fullscreenCamera && getConnectionIcon(fullscreenCamera.type)}
              <span className="capitalize">{fullscreenCamera?.type}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
