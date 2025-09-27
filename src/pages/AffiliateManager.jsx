
import React, { useState, useEffect, useCallback } from 'react';
import { Affiliate } from '@/api/entities';
import { User } from '@/api/entities';
import { AppProduct } from '@/api/entities';
import { AffiliatePack } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Copy, Link as LinkIcon, Loader2, DollarSign, Users, TrendingUp, Package, Download, FileText, Image, Video, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

const APP_URL = "https://app.doubleclick.work";

function AffiliateForm({ formData, onFormChange, onSave, isSaving, onCancel }) {
  return (
    <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-slate-700">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={onFormChange} className="col-span-3 bg-white text-slate-900 border-slate-300" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right text-slate-700">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={onFormChange} className="col-span-3 bg-white text-slate-900 border-slate-300" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unique_code" className="text-right text-slate-700">Unique Code</Label>
                <Input id="unique_code" name="unique_code" value={formData.unique_code} onChange={onFormChange} className="col-span-3 bg-white text-slate-900 border-slate-300" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stripe_coupon_id" className="text-right text-slate-700">Stripe Coupon ID</Label>
                <Input id="stripe_coupon_id" name="stripe_coupon_id" value={formData.stripe_coupon_id} onChange={onFormChange} className="col-span-3 bg-white text-slate-900 border-slate-300" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stripe_promo_code_id" className="text-right text-slate-700">Stripe Promo Code ID</Label>
                <Input id="stripe_promo_code_id" name="stripe_promo_code_id" value={formData.stripe_promo_code_id} onChange={onFormChange} className="col-span-3 bg-white text-slate-900 border-slate-300" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="commission_rate" className="text-right text-slate-700">Commission (%)</Label>
                <Input id="commission_rate" name="commission_rate" type="number" value={formData.commission_rate} onChange={onFormChange} className="col-span-3 bg-white text-slate-900 border-slate-300" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right text-slate-700">Active</Label>
                <Switch id="is_active" name="is_active" checked={formData.is_active} onCheckedChange={(checked) => onFormChange({ target: { name: 'is_active', type: 'checkbox', checked } })} />
            </div>
             <DialogFooter className="pt-4">
                <Button variant="outline" onClick={onCancel} className="bg-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">Cancel</Button>
                <Button onClick={onSave} disabled={isSaving} className="bg-slate-900 text-white hover:bg-slate-800">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                </Button>
            </DialogFooter>
        </div>);

}

function PackForm({ formData, onFormChange, onSave, isSaving, onCancel }) {
  const addMaterial = () => {
    onFormChange({
      target: {
        name: 'materials',
        value: [...(formData.materials || []), { type: 'image', title: '', url: '', description: '' }]
      }
    });
  };

  const removeMaterial = (index) => {
    const newMaterials = [...(formData.materials || [])];
    newMaterials.splice(index, 1);
    onFormChange({
      target: { name: 'materials', value: newMaterials }
    });
  };

  const updateMaterial = (index, field, value) => {
    const newMaterials = [...(formData.materials || [])];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    onFormChange({
      target: { name: 'materials', value: newMaterials }
    });
  };

  return (
    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pack_title" className="text-right text-slate-700">Pack Title</Label>
                <Input
          id="pack_title"
          name="title"
          value={formData.title || ''}
          onChange={onFormChange}
          className="col-span-3 bg-white text-slate-900 border-slate-300" />

            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="pack_description" className="text-right text-slate-700 pt-2">Description</Label>
                <Textarea
          id="pack_description"
          name="description"
          value={formData.description || ''}
          onChange={onFormChange}
          className="col-span-3 bg-white text-slate-900 border-slate-300"
          rows={3} />

            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pack_sort_order" className="text-right text-slate-700">Sort Order</Label>
                <Input
          id="pack_sort_order"
          name="sort_order"
          type="number"
          value={formData.sort_order || 0}
          onChange={onFormChange}
          className="col-span-3 bg-white text-slate-900 border-slate-300" />

            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pack_is_active" className="text-right text-slate-700">Active</Label>
                <Switch
          id="pack_is_active"
          name="is_active"
          checked={formData.is_active !== false}
          onCheckedChange={(checked) => onFormChange({ target: { name: 'is_active', type: 'checkbox', checked } })} />

            </div>

            <div className="col-span-4">
                <div className="flex justify-between items-center mb-4">
                    <Label className="text-slate-700 font-semibold">Marketing Materials</Label>
                    <Button type="button" onClick={addMaterial} size="sm">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Material
                    </Button>
                </div>
                
                {(formData.materials || []).map((material, index) =>
        <div key={index} className="border border-slate-200 rounded p-4 mb-4 bg-slate-50">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                                <Label className="text-slate-700">Type</Label>
                                <Select
                value={material.type || 'image'}
                onValueChange={(value) => updateMaterial(index, 'type', value)}>

                                    <SelectTrigger className="bg-white border-slate-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="copy">Copy Text</SelectItem>
                                        <SelectItem value="link">Link</SelectItem>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-slate-700">Title</Label>
                                <Input
                value={material.title || ''}
                onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                className="bg-white border-slate-300" />

                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 mb-3">
                            <div>
                                <Label className="text-slate-700">URL</Label>
                                <Input
                value={material.url || ''}
                onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                className="bg-white border-slate-300"
                placeholder="https://..." />

                            </div>
                            <div>
                                <Label className="text-slate-700">Usage Instructions</Label>
                                <Textarea
                value={material.description || ''}
                onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                className="bg-white border-slate-300"
                rows={2}
                placeholder="How to use this material..." />

                            </div>
                        </div>
                        <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => removeMaterial(index)}>

                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                        </Button>
                    </div>
        )}
            </div>

            <DialogFooter className="pt-4">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={onSave} disabled={isSaving} className="bg-slate-900 text-white hover:bg-slate-800">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Pack
                </Button>
            </DialogFooter>
        </div>);

}

export default function AffiliateManager() {
  const [affiliates, setAffiliates] = useState([]);
  const [packs, setPacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', unique_code: '', stripe_coupon_id: '', stripe_promo_code_id: '', commission_rate: 20, is_active: true
  });
  const [packFormData, setPackFormData] = useState({
    title: '', description: '', materials: [], is_active: true, sort_order: 0
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPackDeleteConfirm, setShowPackDeleteConfirm] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState(null);
  const [packToDelete, setPackToDelete] = useState(null);
  const [referredUsers, setReferredUsers] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const loadAffiliates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await Affiliate.list('-created_date');
      setAffiliates(data || []);
    } catch (error) {
      toast.error('Failed to load affiliates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPacks = useCallback(async () => {
    try {
      const data = await AffiliatePack.list('sort_order');
      setPacks(data || []);
    } catch (error) {
      toast.error('Failed to load affiliate packs.');
    }
  }, []);

  useEffect(() => {
    loadAffiliates();
    loadPacks();
    const loadProducts = async () => {
      try {
        const productData = await AppProduct.list();
        const pMap = (productData || []).reduce((acc, p) => {
          if (p.stripe_price_id) {
            acc[p.stripe_price_id] = p;
          }
          return acc;
        }, {});
        setProductMap(pMap);
      } catch (error) {
        toast.error('Failed to load products.');
        console.error(error);
      }
    };
    loadProducts();
  }, [loadAffiliates, loadPacks]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePackFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPackFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleOpenDialog = async (affiliate = null) => {
    setSelectedAffiliate(affiliate);
    setReferredUsers([]);
    if (affiliate) {
      setFormData({
        name: affiliate.name || '', email: affiliate.email || '', unique_code: affiliate.unique_code || '',
        stripe_coupon_id: affiliate.stripe_coupon_id || '', stripe_promo_code_id: affiliate.stripe_promo_code_id || '',
        commission_rate: affiliate.commission_rate || 20,
        is_active: affiliate.is_active !== false
      });

      setIsFetchingDetails(true);
      try {
        const users = await User.filter({ referred_by_affiliate_id: affiliate.id }, '-created_date');
        setReferredUsers(users || []);
      } catch (error) {
        toast.error("Failed to fetch referred users.");
        console.error(error);
      } finally {
        setIsFetchingDetails(false);
      }
    } else {
      setFormData({
        name: '', email: '', unique_code: '', stripe_coupon_id: '', stripe_promo_code_id: '', commission_rate: 20, is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleOpenPackDialog = (pack = null) => {
    setSelectedPack(pack);
    if (pack) {
      setPackFormData({
        title: pack.title || '',
        description: pack.description || '',
        materials: pack.materials || [],
        is_active: pack.is_active !== false,
        sort_order: pack.sort_order || 0
      });
    } else {
      setPackFormData({
        title: '', description: '', materials: [], is_active: true, sort_order: 0
      });
    }
    setIsPackDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.unique_code) {
      toast.error('Name, Email, and Unique Code are required.');return;
    }
    setIsSaving(true);
    try {
      const payload = { ...formData, commission_rate: Number(formData.commission_rate) };
      if (selectedAffiliate) {
        await Affiliate.update(selectedAffiliate.id, payload);
        toast.success('Affiliate updated successfully.');
      } else {
        await Affiliate.create(payload);
        toast.success('Affiliate created successfully.');
      }
      await loadAffiliates();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(`Failed to save affiliate: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePackSave = async () => {
    if (!packFormData.title || !packFormData.materials || packFormData.materials.length === 0) {
      toast.error('Title and at least one material are required.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...packFormData,
        sort_order: Number(packFormData.sort_order) || 0
      };
      if (selectedPack) {
        await AffiliatePack.update(selectedPack.id, payload);
        toast.success('Affiliate pack updated successfully.');
      } else {
        await AffiliatePack.create(payload);
        toast.success('Affiliate pack created successfully.');
      }
      await loadPacks();
      setIsPackDialogOpen(false);
    } catch (error) {
      toast.error(`Failed to save affiliate pack: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!affiliateToDelete) return;
    try {
      await Affiliate.delete(affiliateToDelete.id);
      toast.success('Affiliate deleted.');
      await loadAffiliates();
    } catch (error) {
      toast.error('Failed to delete affiliate.');
    } finally {
      setShowDeleteConfirm(false);
      setAffiliateToDelete(null);
    }
  };

  const handlePackDelete = async () => {
    if (!packToDelete) return;
    try {
      await AffiliatePack.delete(packToDelete.id);
      toast.success('Affiliate pack deleted.');
      await loadPacks();
    } catch (error) {
      toast.error('Failed to delete affiliate pack.');
    } finally {
      setShowPackDeleteConfirm(false);
      setPackToDelete(null);
    }
  };

  const openDeleteConfirm = (affiliate) => {
    setAffiliateToDelete(affiliate);
    setShowDeleteConfirm(true);
  };

  const openPackDeleteConfirm = (pack) => {
    setPackToDelete(pack);
    setShowPackDeleteConfirm(true);
  };

  const copyLink = (code) => {
    navigator.clipboard.writeText(`${APP_URL}/?ref=${code}`);
    toast.success('Affiliate link copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-sky-100 text-sky-800',
      past_due: 'bg-amber-100 text-amber-800',
      canceled: 'bg-red-100 text-red-800',
      unpaid: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-slate-100 text-slate-800'}`}>
                {status || 'none'}
            </span>);

  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'image':return <Image className="w-4 h-4" />;
      case 'video':return <Video className="w-4 h-4" />;
      case 'pdf':return <FileText className="w-4 h-4" />;
      case 'link':return <ExternalLink className="w-4 h-4" />;
      default:return <Download className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Affiliate Manager</h1>
                </div>

                <Tabs defaultValue="affiliates" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white">
                        <TabsTrigger value="affiliates" className="data-[state=active]:bg-slate-100">
                            <Users className="w-4 h-4 mr-2" />
                            Affiliates
                        </TabsTrigger>
                        <TabsTrigger value="packs" className="data-[state=active]:bg-slate-100">
                            <Package className="w-4 h-4 mr-2" />
                            Marketing Packs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="affiliates" className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-slate-800">Manage Affiliates</h2>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => handleOpenDialog()}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Affiliate
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white text-slate-900 border-slate-200 sm:max-w-[425px] md:max-w-[800px] lg:max-w-[1000px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-slate-900">
                                            {selectedAffiliate ? `Details for ${selectedAffiliate.name}` : 'Add New Affiliate'}
                                        </DialogTitle>
                                    </DialogHeader>
                                    {selectedAffiliate ?
                  <Tabs defaultValue="details" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                                                <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 data-[state=active]:text-slate-900">Details</TabsTrigger>
                                                <TabsTrigger value="referrals" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 data-[state=active]:text-slate-900">
                                                    Referred Users <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-slate-100 bg-slate-500 rounded-full">{referredUsers.length}</span>
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="details">
                                                <AffiliateForm formData={formData} onFormChange={handleFormChange} onSave={handleSave} isSaving={isSaving} onCancel={() => setIsDialogOpen(false)} />
                                            </TabsContent>
                                            <TabsContent value="referrals">
                                                <div className="mt-4 border rounded-lg overflow-hidden bg-white">
                                                    <div className="max-h-[450px] overflow-y-auto">
                                                        {isFetchingDetails ?
                          <div className="flex items-center justify-center p-12">
                                                                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                                                            </div> :
                          referredUsers.length > 0 ?
                          <Table>
                                                                <TableHeader className="bg-slate-50 sticky top-0">
                                                                    <TableRow>
                                                                        <TableHead className="text-slate-700">User</TableHead>
                                                                        <TableHead className="text-slate-700">Signed Up</TableHead>
                                                                        <TableHead className="text-slate-700">Plan</TableHead>
                                                                        <TableHead className="text-slate-700">Price</TableHead>
                                                                        <TableHead className="text-center text-slate-700">Status</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {referredUsers.map((user) => {
                                const product = productMap[user.plan_price_id] || {};
                                return (
                                  <TableRow key={user.id} className="border-slate-200 hover:bg-slate-50">
                                                                                <TableCell className="font-medium text-slate-900">{user.email}</TableCell>
                                                                                <TableCell className="text-slate-600">{format(new Date(user.created_date), 'MMM d, yyyy')}</TableCell>
                                                                                <TableCell className="text-slate-600">{product.name || 'N/A'}</TableCell>
                                                                                <TableCell className="text-slate-600">{product.display_price || 'N/A'}</TableCell>
                                                                                <TableCell className="text-center">{getStatusBadge(user.subscription_status)}</TableCell>
                                                                            </TableRow>);

                              })}
                                                                </TableBody>
                                                            </Table> :

                          <div className="text-center p-12 text-slate-500">
                                                                <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                                                                <p>No referred users yet.</p>
                                                            </div>
                          }
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        </Tabs> :

                  <AffiliateForm formData={formData} onFormChange={handleFormChange} onSave={handleSave} isSaving={isSaving} onCancel={() => setIsDialogOpen(false)} />
                  }
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {isLoading ?
              <div className="p-8 text-center text-slate-500">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                    <p>Loading affiliates...</p>
                                </div> :

              <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-slate-700">Name</TableHead>
                                            <TableHead className="text-slate-700">Unique Code</TableHead>
                                            <TableHead className="text-center text-slate-700">Commission</TableHead>
                                            <TableHead className="text-center text-slate-700">Referrals</TableHead>
                                            <TableHead className="text-center text-slate-700">Conversions</TableHead>
                                            <TableHead className="text-right text-slate-700">Total Earned</TableHead>
                                            <TableHead className="text-center text-slate-700">Status</TableHead>
                                            <TableHead className="text-right text-slate-700">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {affiliates.map((affiliate) =>
                  <TableRow key={affiliate.id} className="border-slate-200 hover:bg-slate-100">
                                                <TableCell>
                                                    <div className="font-medium text-slate-900">{affiliate.name}</div>
                                                    <div className="text-sm text-slate-500">{affiliate.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">{affiliate.unique_code}</span>
                                                        <Button variant="ghost" size="icon" onClick={() => copyLink(affiliate.unique_code)} title="Copy affiliate link">
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center text-slate-600">{affiliate.commission_rate}%</TableCell>
                                                <TableCell className="text-center text-slate-600">{affiliate.referral_count || 0}</TableCell>
                                                <TableCell className="text-center text-slate-600">{affiliate.conversion_count || 0}</TableCell>
                                                <TableCell className="text-right font-medium text-green-600">${((affiliate.total_earned || 0) / 100).toFixed(2)}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${affiliate.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {affiliate.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(affiliate)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(affiliate)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                  )}
                                    </TableBody>
                                </Table>
              }
                        </div>
                    </TabsContent>

                    <TabsContent value="packs" className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-slate-800">Marketing Packs</h2>
                            <Dialog open={isPackDialogOpen} onOpenChange={setIsPackDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => handleOpenPackDialog()}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Marketing Pack
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white text-slate-900 border-slate-200 sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-slate-900">
                                            {selectedPack ? 'Edit Marketing Pack' : 'Add New Marketing Pack'}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <PackForm
                    formData={packFormData}
                    onFormChange={handlePackFormChange}
                    onSave={handlePackSave}
                    isSaving={isSaving}
                    onCancel={() => setIsPackDialogOpen(false)} />

                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid gap-6">
                            {packs.length === 0 ?
              <div className="text-center py-12 bg-white rounded-lg">
                                    <Package className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                    <p className="text-slate-500">No marketing packs created yet.</p>
                                </div> :

              packs.map((pack) =>
              <div key={pack.id} className="bg-white rounded-lg shadow-md p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">{pack.title}</h3>
                                                <p className="text-slate-600 mt-1">{pack.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${pack.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {pack.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenPackDialog(pack)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openPackDeleteConfirm(pack)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pack.materials?.map((material, index) =>
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {getMaterialIcon(material.type)}
                                                        <span className="font-medium text-slate-900">{material.title}</span>
                                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{material.type}</span>
                                                    </div>
                                                    {material.description &&
                    <p className="text-sm text-slate-600 mb-3">{material.description}</p>
                    }
                                                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">

                                                        View <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                  )}
                                        </div>
                                    </div>
              )
              }
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Delete Confirmations */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">
                            This action cannot be undone. This will permanently delete the affiliate.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showPackDeleteConfirm} onOpenChange={setShowPackDeleteConfirm}>
                <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">
                            This action cannot be undone. This will permanently delete the marketing pack.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePackDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>);

}