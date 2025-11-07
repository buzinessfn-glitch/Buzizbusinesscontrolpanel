import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Palette, Upload, Building, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState } from '../../App';

interface OfficeTheme {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  officeLogo?: string;
  officeBanner?: string;
}

interface OfficeCustomizationProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export function OfficeCustomization({ appState, setAppState }: OfficeCustomizationProps) {
  const [theme, setTheme] = useState<OfficeTheme>({
    primaryColor: '#facc15',
    secondaryColor: '#000000',
    tertiaryColor: '#ffffff'
  });
  const [saving, setSaving] = useState(false);

  const canCustomize = appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager;

  useEffect(() => {
    loadTheme();
  }, [appState.office]);

  const loadTheme = async () => {
    if (!appState.office) return;
    
    try {
      const data = await getData(appState.office.id, 'office-theme');
      if (data.data) {
        setTheme(data.data);
        applyTheme(data.data);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const applyTheme = (themeData: OfficeTheme) => {
    // Apply CSS custom properties
    document.documentElement.style.setProperty('--office-primary', themeData.primaryColor);
    document.documentElement.style.setProperty('--office-secondary', themeData.secondaryColor);
    document.documentElement.style.setProperty('--office-tertiary', themeData.tertiaryColor);
  };

  const handleSaveTheme = async () => {
    if (!appState.office || !appState.currentEmployee) return;

    setSaving(true);
    try {
      await updateData(appState.office.id, 'office-theme', theme);
      applyTheme(theme);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Office Theme Updated',
        'Customized office branding and colors',
        'admin'
      );

      toast.success('Theme saved successfully');
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleResetTheme = () => {
    const defaultTheme: OfficeTheme = {
      primaryColor: '#facc15',
      secondaryColor: '#000000',
      tertiaryColor: '#ffffff'
    };
    setTheme(defaultTheme);
    applyTheme(defaultTheme);
    toast.success('Theme reset to defaults');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTheme(prev => ({ ...prev, officeLogo: reader.result as string }));
      toast.success('Logo uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTheme(prev => ({ ...prev, officeBanner: reader.result as string }));
      toast.success('Banner uploaded');
    };
    reader.readAsDataURL(file);
  };

  if (!canCustomize) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center border-2 border-black">
          <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only creators and head managers can customize the office</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1 flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Office Customization
          </h1>
          <p className="text-gray-600">Customize your office branding and theme</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleResetTheme}
            variant="outline"
            className="border-2 border-black"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSaveTheme}
            disabled={saving}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Color Customization */}
        <Card className="p-6 border-2 border-black">
          <h3 className="text-black mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Scheme
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => setTheme(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={theme.primaryColor}
                  onChange={(e) => setTheme(prev => ({ ...prev, primaryColor: e.target.value }))}
                  placeholder="#facc15"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Main accent color (buttons, highlights)</p>
            </div>

            <div>
              <Label>Secondary Color</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  type="color"
                  value={theme.secondaryColor}
                  onChange={(e) => setTheme(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={theme.secondaryColor}
                  onChange={(e) => setTheme(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Secondary color (text, borders)</p>
            </div>

            <div>
              <Label>Tertiary Color</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  type="color"
                  value={theme.tertiaryColor}
                  onChange={(e) => setTheme(prev => ({ ...prev, tertiaryColor: e.target.value }))}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={theme.tertiaryColor}
                  onChange={(e) => setTheme(prev => ({ ...prev, tertiaryColor: e.target.value }))}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Background and card colors</p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 rounded-lg border-2 border-gray-300">
            <p className="text-sm text-gray-600 mb-3">Preview:</p>
            <div className="flex gap-2">
              <div
                className="w-16 h-16 rounded-lg shadow-lg"
                style={{ backgroundColor: theme.primaryColor }}
              />
              <div
                className="w-16 h-16 rounded-lg shadow-lg"
                style={{ backgroundColor: theme.secondaryColor }}
              />
              <div
                className="w-16 h-16 rounded-lg shadow-lg border-2 border-gray-300"
                style={{ backgroundColor: theme.tertiaryColor }}
              />
            </div>
          </div>
        </Card>

        {/* Logo & Banner */}
        <Card className="p-6 border-2 border-black">
          <h3 className="text-black mb-4 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Branding Assets
          </h3>
          <div className="space-y-6">
            {/* Office Logo */}
            <div>
              <Label>Office Logo</Label>
              <div className="mt-1.5">
                {theme.officeLogo ? (
                  <div className="relative">
                    <img
                      src={theme.officeLogo}
                      alt="Office logo"
                      className="w-32 h-32 object-contain border-2 border-gray-300 rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTheme(prev => ({ ...prev, officeLogo: undefined }))}
                      className="mt-2"
                    >
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload logo</span>
                    <span className="text-xs text-gray-500">PNG, JPG, GIF (max 2MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Office Banner */}
            <div>
              <Label>Office Banner (Optional)</Label>
              <div className="mt-1.5">
                {theme.officeBanner ? (
                  <div className="relative">
                    <img
                      src={theme.officeBanner}
                      alt="Office banner"
                      className="w-full h-32 object-cover border-2 border-gray-300 rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTheme(prev => ({ ...prev, officeBanner: undefined }))}
                      className="mt-2"
                    >
                      Remove Banner
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload banner</span>
                    <span className="text-xs text-gray-500">PNG, JPG (recommended: 1200x300)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Preview Card */}
      <Card className="p-6 border-2 border-black">
        <h3 className="text-black mb-4">Live Preview</h3>
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: theme.tertiaryColor,
            borderColor: theme.secondaryColor,
            borderWidth: '2px'
          }}
        >
          {theme.officeBanner && (
            <img
              src={theme.officeBanner}
              alt="Banner preview"
              className="w-full h-24 object-cover rounded-lg mb-4"
            />
          )}
          <div className="flex items-center gap-4 mb-4">
            {theme.officeLogo && (
              <img
                src={theme.officeLogo}
                alt="Logo preview"
                className="w-16 h-16 object-contain"
              />
            )}
            <div>
              <h2 className="text-2xl" style={{ color: theme.secondaryColor }}>
                {appState.office?.name}
              </h2>
              <p className="text-gray-600">Office Dashboard</p>
            </div>
          </div>
          <Button
            style={{
              backgroundColor: theme.primaryColor,
              color: theme.secondaryColor
            }}
          >
            Sample Button
          </Button>
        </div>
      </Card>
    </div>
  );
}
