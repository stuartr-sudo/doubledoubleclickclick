import React, { useState, useEffect } from 'react';
import { AffiliatePack } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  PlusCircle, Edit, Trash2, Plus, Minus, 
  Image, Video, FileText, ExternalLink, Loader2 
} from 'lucide-react';

export default function AffiliatePackManager() {
  const [packs, setPacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    materials: [],
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    setIsLoading(true);
    try {
      const data = await AffiliatePack.list('-updated_date');
      setPacks(data || []);
    } catch (error) {
      console.error('Failed to load packs:', error);
      toast.error('Failed to load marketing packs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (pack = null) => {
    if (pack) {
      setSelectedPack(pack);
      setFormData({
        title: pack.title || '',
        description: pack.description || '',
        materials: pack.materials || [],
        is_active: pack.is_active !== false,
        sort_order: pack.sort_order || 0
      });
    } else {
      setSelectedPack(null);
      setFormData({
        title: '',
        description: '',
        materials: [],
        is_active: true,
        sort_order: 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedPack) {
        await AffiliatePack.update(selectedPack.id, formData);
        toast.success('Marketing pack updated successfully');
      } else {
        await AffiliatePack.create(formData);
        toast.success('Marketing pack created successfully');
      }
      await loadPacks();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save marketing pack');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (pack) => {
    if (!confirm('Are you sure you want to delete this marketing pack?')) return;
    
    try {
      await AffiliatePack.delete(pack.id);
      toast.success('Marketing pack deleted');
      await loadPacks();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete marketing pack');
    }
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { type: 'image', title: '', url: '', description: '' }]
    }));
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterial = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Marketing Packs Manager</h1>
            <p className="text-slate-600">Manage marketing materials for your affiliates</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Marketing Pack
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white text-slate-900 max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedPack ? 'Edit Marketing Pack' : 'Add New Marketing Pack'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                      placeholder="e.g., Q4 2024 Holiday Campaign"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({...prev, sort_order: Number(e.target.value)}))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                    placeholder="Describe what's included in this pack"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Marketing Materials</Label>
                    <Button type="button" onClick={addMaterial} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Material
                    </Button>
                  </div>
                  {formData.materials.map((material, index) => (
                    <Card key={index} className="mb-4">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <Label>Type</Label>
                            <Select
                              value={material.type}
                              onValueChange={(value) => updateMaterial(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="copy">Copy</SelectItem>
                                <SelectItem value="link">Link</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={material.title}
                              onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                              placeholder="Material title"
                            />
                          </div>
                          <div>
                            <Label>URL</Label>
                            <Input
                              value={material.url}
                              onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          <div className="flex items-end">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon"
                              onClick={() => removeMaterial(index)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={material.description}
                            onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                            placeholder="How to use this material"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading marketing packs...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packs.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pack.title}</div>
                        <div className="text-sm text-slate-600">{pack.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {pack.materials.map((material, index) => (
                          <div key={index} className="flex items-center">
                            {getTypeIcon(material.type)}
                          </div>
                        ))}
                        <span className="text-sm text-slate-600 ml-2">
                          {pack.materials.length} item{pack.materials.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={pack.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {pack.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{pack.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pack)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(pack)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}