'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { fcfa, API, adminHeaders } from '@/lib/api';
import AdminCharts from '@/components/AdminCharts';

type Shop = {
  id: number;
  name: string;
  slug: string;
  city: string;
  whatsapp: string;
  products_count?: number;
  orders_count?: number;
};

type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
};

type Order = {
  id: number;
  reference: string;
  customer_name: string;
  customer_phone: string;
  region: string;
  ville_quartier: string;
  points_repere: string;
  delivery_method: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: 'wave' | 'orange_money' | 'cod';
  status: 'pending' | 'paid' | 'assigned' | 'delivered' | 'failed' | 'cancelled';
  delivery_status?: string;
  refunded_amount?: number;
  transaction_ref: string | null;
  created_at: string;
  items: OrderItem[];
  shop_id?: number | null;
  shop?: Shop | null;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  active: boolean;
  image_url: string | null;
  description?: string;
  shop_id?: number | null;
  shop?: Shop | null;
};
type AdminAccount = { id:number; name:string; email:string; role:'owner'|'manager'|'logistics'; active:boolean; created_at:string };
type AuditEntry = { id:number; action:string; subject_type:string|null; subject_id:number|null; details:Record<string,unknown>; created_at:string; admin?:{name:string;email:string}|null };

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'En attente', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
  paid: { label: 'Payée (Confirmée)', bg: 'bg-sky-50 border-sky-200', text: 'text-sky-800' },
  assigned: { label: 'Assignée au livreur', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800' },
  delivered: { label: 'Livrée avec succès', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
  cancelled: { label: 'Annulée', bg: 'bg-stone-100 border-stone-200', text: 'text-stone-700' },
  failed: { label: 'Échouée', bg: 'bg-red-50 border-red-200', text: 'text-red-800' },
};


const PRESET_IMAGES = [
  { label: 'Boubou Bazin', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Thiouraye / Encens', url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Sac Cuir Thiès', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Bijoux Filigrane', url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Robe & Soie', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Parfum / Musc', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1000&q=80' },
];

export default function AdminDashboard() {
  const [token, setToken] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'stats' | 'tools' | 'users'>('orders');
  const [lowStock, setLowStock] = useState<{id:number;name:string;stock:number;low_stock_threshold:number}[]>([]);
  const [metrics, setMetrics] = useState<{orders:number;open_orders:number;delivered:number;revenue:number;low_stock_count:number;top_products:{product_name:string;quantity:number;revenue:number}[]} | null>(null);
  const [coupons, setCoupons] = useState<{id:number;code:string;discount_type:string;discount_value:number;used_count:number;active:boolean}[]>([]);
  const [couponDraft, setCouponDraft] = useState({code:'',discount_type:'percent',discount_value:10,minimum_order:0,usage_limit:'',starts_at:'',ends_at:'',active:true});
  const [adminAccounts,setAdminAccounts]=useState<AdminAccount[]>([]);
  const [auditEntries,setAuditEntries]=useState<AuditEntry[]>([]);
  const [adminDraft,setAdminDraft]=useState({name:'',email:'',role:'manager',password:''});
  const [passwordChange,setPasswordChange]=useState({current_password:'',password:'',password_confirmation:''});

  // Multi-Shop State
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('all');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);

  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    slug: '',
    price: 35000,
    stock: 10,
    description: '',
    image_url: PRESET_IMAGES[0].url,
    active: true,
    shop_id: 1,
  });
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(PRESET_IMAGES[0].url);
  const [addingProduct, setAddingProduct] = useState<boolean>(false);
  const [productError, setProductError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Export Date
  const [exportDate, setExportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('teranga_admin_token') || '';
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      fetchAdminUser(savedToken).then((role) => {
        if (!role) return;
        fetchShops(savedToken);
        fetchOrders(savedToken, selectedShopId);
        if (role !== 'logistics') fetchProducts(savedToken, selectedShopId);
        fetchAdminExtras(savedToken, selectedShopId, role);
      });
    }
  }, []);

  // Re-fetch when selected shop changes
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchOrders(token, selectedShopId);
      if (adminRole !== 'logistics') fetchProducts(token, selectedShopId);
      fetchAdminExtras(token, selectedShopId, adminRole);
    }
  }, [selectedShopId, adminRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email: emailInput, password: passwordInput }) });
    const data = await res.json();
    if (!res.ok) { alert(data.message || 'Connexion refusée.'); return; }
    sessionStorage.setItem('teranga_admin_token', data.token);
    setToken(data.token); setIsAuthenticated(true);
    setAdminRole(data.user.role);
    setActiveTab('orders');
    fetchShops(data.token); fetchOrders(data.token, selectedShopId);
    if (data.user.role !== 'logistics') fetchProducts(data.token, selectedShopId);
    fetchAdminExtras(data.token, selectedShopId, data.user.role);
  };

  const handleLogout = () => {
    if (token) fetch(`${API}/admin/logout`, { method: 'POST', headers: adminHeaders(token) });
    sessionStorage.removeItem('teranga_admin_token');
    setToken('');
    setAdminRole('');
    setIsAuthenticated(false);
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  async function fetchAdminExtras(t: string = token, shopId: string = selectedShopId, role: string = adminRole) {
    const headers = { Accept: 'application/json', ...adminHeaders(t) };
    const shopQuery = shopId === 'all' ? '' : `?shop_id=${shopId}`;
    if (role !== 'logistics') {
      const [stockRes, metricsRes, couponRes] = await Promise.all([
        fetch(`${API}/admin/low-stock${shopQuery}`, { headers }), fetch(`${API}/admin/metrics${shopQuery}`, { headers }), fetch(`${API}/admin/coupons`, { headers }),
      ]);
      if (stockRes.ok) setLowStock(await stockRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (couponRes.ok) setCoupons(await couponRes.json());
    }
    if (role === 'owner') {
      const [usersRes, auditRes] = await Promise.all([fetch(`${API}/admin/users`, { headers }), fetch(`${API}/admin/audit-logs`, { headers })]);
      if (usersRes.ok) setAdminAccounts(await usersRes.json());
      if (auditRes.ok) setAuditEntries(await auditRes.json());
    }
  }

  async function fetchAdminUser(t: string = token): Promise<string | null> {
    const res = await fetch(`${API}/admin/me`, { headers: adminHeaders(t) });
    if (res.ok) {
      const role = (await res.json()).role as string;
      setAdminRole(role);
      return role;
    }
    sessionStorage.removeItem('teranga_admin_token'); setIsAuthenticated(false);
    return null;
  }

  async function saveCoupon(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${API}/admin/coupons`, { method:'POST', headers:{'Content-Type':'application/json',Accept:'application/json',...adminHeaders(token)}, body:JSON.stringify({...couponDraft,usage_limit:couponDraft.usage_limit ? Number(couponDraft.usage_limit) : null}) });
    const data = await res.json();
    if (!res.ok) { alert(data.message || 'Impossible de créer le code promo.'); return; }
    setCoupons(prev => [data,...prev]); setCouponDraft({code:'',discount_type:'percent',discount_value:10,minimum_order:0,usage_limit:'',starts_at:'',ends_at:'',active:true});
  }

  async function toggleCoupon(coupon:{id:number;active:boolean}) {
    const res=await fetch(`${API}/admin/coupons/${coupon.id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Accept:'application/json',...adminHeaders(token)},body:JSON.stringify({active:!coupon.active})});
    if(res.ok){const updated=await res.json();setCoupons(prev=>prev.map(c=>c.id===coupon.id?updated:c));}
  }

  async function createAdminAccount(e:React.FormEvent) {
    e.preventDefault();
    const res=await fetch(`${API}/admin/users`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',...adminHeaders(token)},body:JSON.stringify(adminDraft)});
    const data=await res.json(); if(!res.ok){alert(data.message||'Création du compte impossible.');return;}
    setAdminAccounts(prev=>[...prev,data]);setAdminDraft({name:'',email:'',role:'manager',password:''});fetchAdminExtras();
  }

  async function toggleAdminAccount(account:AdminAccount) {
    const res=await fetch(`${API}/admin/users/${account.id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Accept:'application/json',...adminHeaders(token)},body:JSON.stringify({active:!account.active})});
    if(res.ok){const data=await res.json();setAdminAccounts(prev=>prev.map(a=>a.id===data.id?data:a));}
  }

  async function resetAdminPassword(account:AdminAccount) {
    const password=prompt(`Nouveau mot de passe pour ${account.email} (12 caractères minimum)`);if(!password)return;
    const res=await fetch(`${API}/admin/users/${account.id}/password`,{method:'PATCH',headers:{'Content-Type':'application/json',Accept:'application/json',...adminHeaders(token)},body:JSON.stringify({password})});
    if(!res.ok)alert((await res.json()).message||'Réinitialisation impossible.');else alert('Mot de passe changé et sessions révoquées.');
  }

  async function changeOwnPassword(e:React.FormEvent) {
    e.preventDefault();
    const res=await fetch(`${API}/admin/password`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',...adminHeaders(token)},body:JSON.stringify(passwordChange)});
    if(!res.ok){alert((await res.json()).message||'Modification impossible.');return;}
    setPasswordChange({current_password:'',password:'',password_confirmation:''});fetchAdminExtras();alert('Mot de passe modifié. Les autres sessions sont déconnectées.');
  }

  async function updateDelivery(orderId:number,status:string) {
    const res=await fetch(`${API}/admin/orders/${orderId}/delivery`,{method:'PATCH',headers:{'Content-Type':'application/json',Accept:'application/json',...adminHeaders(token)},body:JSON.stringify({status})});
    if(res.ok) fetchOrders(); else alert((await res.json()).message || 'Mise à jour impossible.');
  }

  async function recordRefund(order:Order) {
    const amount=Number(prompt(`Montant à enregistrer en remboursement (max ${order.total_amount-(order.refunded_amount||0)} FCFA)`));
    if(!amount) return;
    const note=prompt('Note (ex. remboursement effectué via Wave)'); if(!note) return;
    const res=await fetch(`${API}/admin/orders/${order.id}/refund`,{method:'PATCH',headers:{'Content-Type':'application/json',Accept:'application/json',...adminHeaders(token)},body:JSON.stringify({amount,note})});
    if(!res.ok) { alert((await res.json()).message || 'Remboursement non enregistré.'); return; }
    fetchOrders(); fetchAdminExtras();
  }

  // Fetch Shops
  async function fetchShops(t: string = token) {
    try {
      const res = await fetch(`${API}/admin/shops`, {
        headers: { Accept: 'application/json', ...adminHeaders(t) },
      });
      if (res.ok) {
        const data = await res.json();
        setShops(data || []);
        if (data.length > 0 && !newProduct.shop_id) {
          setNewProduct((prev) => ({ ...prev, shop_id: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Erreur chargement boutiques:', err);
    }
  }

  // Fetch orders from API (with optional shop filter)
  async function fetchOrders(t: string = token, shopId: string = 'all') {
    setLoadingOrders(true);
    try {
      const url = shopId === 'all' ? `${API}/admin/orders` : `${API}/admin/orders?shop_id=${shopId}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json', ...adminHeaders(t) },
      });
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      setOrders(data.data || []);
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    } finally {
      setLoadingOrders(false);
    }
  }

  // Fetch products from API (with optional shop filter)
  async function fetchProducts(t: string = token, shopId: string = 'all') {
    setLoadingProducts(true);
    try {
      const url = shopId === 'all' ? `${API}/admin/products` : `${API}/admin/products?shop_id=${shopId}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json', ...adminHeaders(t) },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err);
    } finally {
      setLoadingProducts(false);
    }
  }

  // Direct File Import from Computer / Device
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show temporary local preview
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setUploadingImage(true);
    setProductError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API}/admin/upload-image`, {
        method: 'POST',
        headers: {
          ...adminHeaders(token),
          // Note: fetch will automatically set multipart/form-data boundary
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'envoi de l'image.");
      }

      // Update product image_url with uploaded public URL
      setNewProduct((prev) => ({ ...prev, image_url: data.url }));
      setImagePreview(data.url);
    } catch (err: any) {
      setProductError(err.message || "Impossible d'importer l'image");
    } finally {
      setUploadingImage(false);
    }
  }

  // Create Product
  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductError('');
    setAddingProduct(true);

    try {
      const res = await fetch(`${API}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...adminHeaders(token),
        },
        body: JSON.stringify(newProduct),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (Object.values(data.errors || {}).flat()[0] as string) || 'Erreur lors de la création');
      }

      setProducts((prev) => [data, ...prev]);
      setShowAddProductModal(false);
      setNewProduct({
        name: '',
        slug: '',
        price: 35000,
        stock: 10,
        description: '',
        image_url: PRESET_IMAGES[0].url,
        active: true,
        shop_id: shops[0]?.id || 1,
      });
      setImagePreview(PRESET_IMAGES[0].url);
    } catch (err: any) {
      setProductError(err.message || 'Erreur inconnue');
    } finally {
      setAddingProduct(false);
    }
  }

  // Delete Product
  async function handleDeleteProduct(id: number) {
    if (!confirm('Confirmez-vous la suppression de ce produit ?')) return;

    try {
      const res = await fetch(`${API}/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', ...adminHeaders(token) },
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Erreur suppression produit:', err);
    }
  }

  // Update order status
  async function updateOrderStatus(orderId: number, newStatus: string) {
    setStatusUpdating(orderId);
    try {
      const res = await fetch(`${API}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...adminHeaders(token),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: updated.status, delivery_status: updated.delivery_status } : o)));
        fetchAdminExtras();
      } else alert((await res.json()).message || 'Statut non modifié.');
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    } finally {
      setStatusUpdating(null);
    }
  }

  // Update product stock/price
  async function updateProductField(productId: number, fields: Partial<Product>) {
    try {
      const res = await fetch(`${API}/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...adminHeaders(token),
        },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      }
    } catch (err) {
      console.error('Erreur mise à jour produit:', err);
    }
  }

  // Export deliveries CSV for couriers
  async function handleExportCsv() {
    const shopParam = selectedShopId !== 'all' ? `&shop_id=${selectedShopId}` : '';
    const res=await fetch(`${API}/admin/orders-export?date=${exportDate}${shopParam}`,{headers:adminHeaders(token)});
    if(!res.ok){alert('Export indisponible.');return;}
    const url=URL.createObjectURL(await res.blob()); const link=document.createElement('a'); link.href=url; link.download=`livraisons-${exportDate}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  // Metrics
  const totalRevenue = metrics?.revenue ?? orders.reduce((sum, o) => (['paid','assigned','delivered'].includes(o.status) && (o.payment_method !== 'cod' || o.status === 'delivered') ? sum + o.total_amount - (o.refunded_amount || 0) : sum), 0);
  const pendingOrders = metrics?.open_orders ?? orders.filter((o) => ['pending', 'paid', 'assigned'].includes(o.status)).length;
  const deliveredOrders = metrics?.delivered ?? orders.filter((o) => o.status === 'delivered').length;

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesQuery =
      searchQuery === '' ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_phone.includes(searchQuery) ||
      o.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.ville_quartier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  // Analytics Computation for charts
  const stats = useMemo(() => {
    const productSales: Record<string, { count: number; revenue: number }> = {};

    orders.forEach((o) => {
      if (!['paid','assigned','delivered'].includes(o.status) || (o.payment_method === 'cod' && o.status !== 'delivered')) return;
      o.items?.forEach((it) => {
        if (!productSales[it.product_name]) {
          productSales[it.product_name] = { count: 0, revenue: 0 };
        }
        productSales[it.product_name].count += it.quantity;
        productSales[it.product_name].revenue += it.quantity * it.unit_price;
      });
    });

    return {
      productSales: Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue),
    };
  }, [orders]);
  const topProducts = metrics?.top_products?.length
    ? metrics.top_products.map(p => [p.product_name,{count:p.quantity,revenue:p.revenue}] as [string,{count:number;revenue:number}])
    : stats.productSales;

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-sand-50/60 py-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-8 shadow-luxury">
          <div className="text-center mb-6">
            <span className="font-serif text-2xl font-bold tracking-[0.2em] text-onyx">TERANGA</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta-600">Espace Multi-Boutiques</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-onyx mb-1">Adresse e-mail</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@boutique.sn"
                className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-3 text-sm text-onyx outline-none focus:border-terracotta-500"
              />
              <label className="mt-3 block text-xs font-bold uppercase text-onyx mb-1">Mot de passe</label>
              <input type="password" required autoComplete="current-password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-3 text-sm text-onyx outline-none focus:border-terracotta-500" />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-terracotta-500 py-3.5 font-bold text-white shadow hover:bg-terracotta-600 transition"
            >
              Accéder au Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentShopName = selectedShopId === 'all'
    ? 'Toutes les Boutiques (Vue Globale)'
    : shops.find((s) => s.id.toString() === selectedShopId)?.name || 'Boutique';

  return (
    <div className="min-h-screen bg-sand-50/40 pb-20 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-sand-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-terracotta-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-terracotta-700">
                Back-Office Multi-Boutiques 🇸🇳
              </span>
              <span className="text-xs text-onyx-light">• Dakar • Thiès • Saint-Louis</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-onyx mt-1">
              Tableau de Bord Administrateur
            </h1>
          </div>

          {/* Multi-Shop Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Boutique Switcher */}
            <div className="flex items-center gap-1.5 rounded-xl border-2 border-terracotta-500/80 bg-white px-3 py-1.5 shadow-sm">
              <span className="text-xs font-bold text-terracotta-700">🏪 Boutique :</span>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="bg-transparent text-xs font-bold text-onyx outline-none cursor-pointer"
              >
                <option value="all">Toutes les Boutiques ({shops.length})</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id.toString()}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                fetchOrders(token, selectedShopId);
                fetchProducts(token, selectedShopId);
              }}
              className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-xs font-semibold text-onyx hover:bg-sand-50 shadow-sm transition"
            >
              ↻ Rafraîchir
            </button>
            <Link
              href="/"
              className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-xs font-semibold text-onyx hover:bg-sand-50 shadow-sm transition"
            >
              ← Voir la Boutique
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-onyx px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-onyx-soft transition"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Current Active Filter Indicator */}
        <div className="mt-3 flex items-center justify-between text-xs text-onyx-muted">
          <span>
            Affichage des données pour : <strong className="text-terracotta-700">{currentShopName}</strong>
          </span>
          {selectedShopId !== 'all' && (
            <button
              onClick={() => setSelectedShopId('all')}
              className="text-terracotta-600 hover:underline font-semibold"
            >
              Réinitialiser vers la vue globale →
            </button>
          )}
        </div>

        {/* Metric Cards */}
        {adminRole !== 'logistics' && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
          <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-luxury-sm">
            <span className="text-[11px] font-bold uppercase text-onyx-light">Chiffre d’Affaires</span>
            <p className="mt-1 font-serif text-xl sm:text-2xl font-bold text-terracotta-700">{fcfa(totalRevenue)}</p>
            <span className="text-[10px] text-emerald-700 font-semibold">{currentShopName}</span>
          </div>

          <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-luxury-sm">
            <span className="text-[11px] font-bold uppercase text-onyx-light">Total Commandes</span>
            <p className="mt-1 font-serif text-xl sm:text-2xl font-bold text-onyx">{orders.length}</p>
            <span className="text-[10px] text-onyx-light">Enregistrées pour cette boutique</span>
          </div>

          <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-luxury-sm">
            <span className="text-[11px] font-bold uppercase text-onyx-light">À Expédier / En Cours</span>
            <p className="mt-1 font-serif text-xl sm:text-2xl font-bold text-amber-600">{pendingOrders}</p>
            <span className="text-[10px] text-amber-700 font-medium">Attente, payées ou assignées</span>
          </div>

          <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-luxury-sm">
            <span className="text-[11px] font-bold uppercase text-onyx-light">Livrées avec Succès</span>
            <p className="mt-1 font-serif text-xl sm:text-2xl font-bold text-emerald-600">{deliveredOrders}</p>
            <span className="text-[10px] text-emerald-700 font-medium">Colis réceptionnés</span>
          </div>
        </div>}

        {/* Tab Switcher & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-200 pb-3 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-onyx text-white shadow-sm'
                  : 'bg-white text-onyx-muted hover:bg-sand-50 border border-sand-200'
              }`}
            >
              Commandes ({orders.length})
            </button>
            {adminRole !== 'logistics' && <button
              onClick={() => setActiveTab('products')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'products'
                  ? 'bg-onyx text-white shadow-sm'
                  : 'bg-white text-onyx-muted hover:bg-sand-50 border border-sand-200'
              }`}
            >
              Catalogue & Stocks ({products.length})
            </button>}
            {adminRole !== 'logistics' && <button
              onClick={() => setActiveTab('stats')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'stats'
                  ? 'bg-onyx text-white shadow-sm'
                  : 'bg-white text-onyx-muted hover:bg-sand-50 border border-sand-200'
              }`}
            >
              <span>📊 Statistiques & Graphiques</span>
            </button>}
            <button onClick={() => setActiveTab('tools')} className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === 'tools' ? 'bg-onyx text-white shadow-sm' : 'bg-white text-onyx-muted hover:bg-sand-50 border border-sand-200'}`}>
              {adminRole === 'logistics' ? 'Mon compte' : 'Promos & Alertes'}
            </button>
            {adminRole==='owner' && <button onClick={()=>setActiveTab('users')} className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab==='users'?'bg-onyx text-white':'bg-white text-onyx-muted border border-sand-200'}`}>Équipe & Journal</button>}
          </div>

          {/* Right Action: Courier Export or Add Product */}
          {activeTab === 'orders' ? (
            <div className="flex items-center gap-2 bg-white rounded-xl border border-sand-200 p-1.5 shadow-sm">
              <span className="text-[11px] font-bold text-onyx-light px-2 hidden sm:inline">Feuille Livreurs :</span>
              <input
                type="date"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                className="rounded-lg border border-sand-200 px-2 py-1 text-xs text-onyx outline-none"
              />
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export CSV Livreurs</span>
              </button>
            </div>
          ) : activeTab === 'products' ? (
            <button
              onClick={() => setShowAddProductModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-terracotta-500 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-terracotta-600 transition active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Ajouter un Produit (Import Photo)</span>
            </button>
          ) : null}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: ORDERS MANAGEMENT */}
        {/* ============================================================ */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom client, téléphone, quartier, référence..."
                  className="w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-onyx outline-none focus:border-terracotta-500 shadow-sm"
                />
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                    statusFilter === 'all'
                      ? 'bg-terracotta-500 text-white'
                      : 'bg-white text-onyx-muted hover:bg-sand-50 border border-sand-200'
                  }`}
                >
                  Tous ({orders.length})
                </button>
                {Object.keys(STATUS_LABELS).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                      statusFilter === st
                        ? 'bg-terracotta-500 text-white'
                        : 'bg-white text-onyx-muted hover:bg-sand-50 border border-sand-200'
                    }`}
                  >
                    {STATUS_LABELS[st].label} ({orders.filter((o) => o.status === st).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Cards List */}
            {loadingOrders ? (
              <div className="rounded-2xl border border-sand-200 bg-white p-12 text-center text-onyx-muted">
                Chargement des commandes en cours...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-2xl border border-sand-200 bg-white p-12 text-center text-onyx-muted">
                Aucune commande ne correspond aux filtres appliqués.
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                  const targetShop = order.shop;
                  const waClientLink = `https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Bonjour ${order.customer_name}, c'est ${targetShop?.name || 'Teranga Atelier'} concernant votre commande réf ${order.reference}.`
                  )}`;

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-sand-200 bg-white p-4 sm:p-5 shadow-luxury-sm hover:border-terracotta-300 transition duration-200"
                    >
                      {/* Top Bar of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-sand-100 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-onyx">{order.reference}</span>
                          {targetShop && (
                            <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-[10px] font-bold text-onyx">
                              🏪 {targetShop.name} ({targetShop.city})
                            </span>
                          )}
                          <span className="text-xs text-onyx-light">• {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Status badge & selector */}
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                          </span>
                          {adminRole !== 'logistics' && <select
                            value={order.status}
                            disabled={statusUpdating === order.id}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="rounded-lg border border-sand-300 bg-white px-2 py-1 text-xs font-semibold text-onyx outline-none focus:border-terracotta-500"
                          >
                            <><option value="pending">En attente</option><option value="paid">Payée</option><option value="assigned">Assignée au livreur</option><option value="delivered">Livrée</option><option value="cancelled">Annulée</option><option value="failed">Échouée</option></>
                          </select>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 border-t border-sand-100 pt-3 text-xs">
                        <label className="font-semibold text-onyx-muted">Livraison
                          <select value={order.delivery_status || 'unprepared'} onChange={e => updateDelivery(order.id,e.target.value)} className="ml-2 rounded-lg border border-sand-300 bg-white px-2 py-1 text-xs text-onyx">
                            <option value="unprepared">À préparer</option><option value="preparing">En préparation</option><option value="ready">Prête</option><option value="shipped">Expédiée</option><option value="delivered">Livrée</option>
                          </select>
                        </label>
                        {adminRole === 'owner' && order.status !== 'pending' && order.status !== 'failed' && (order.payment_method !== 'cod' || order.status === 'delivered') && (order.refunded_amount || 0) < order.total_amount && <button onClick={() => recordRefund(order)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 font-bold text-amber-800">Enregistrer un remboursement ({fcfa(order.refunded_amount || 0)})</button>}
                      </div>

                      {/* Middle Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 text-xs">
                        {/* Client details */}
                        <div className="space-y-1">
                          <p className="font-bold text-onyx text-sm">{order.customer_name}</p>
                          <div className="flex items-center gap-2">
                            <a href={`tel:${order.customer_phone}`} className="font-medium text-terracotta-600 hover:underline">
                              📞 {order.customer_phone}
                            </a>
                            <a
                              href={waClientLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                            >
                              WhatsApp 💬
                            </a>
                          </div>
                        </div>

                        {/* Delivery Destination */}
                        <div className="space-y-1">
                          <p className="font-semibold text-onyx">
                            📍 {order.region} — {order.ville_quartier}
                          </p>
                          <p className="text-onyx-muted italic">Repère : {order.points_repere}</p>
                        </div>

                        {/* Financials & Payment method */}
                        <div className="space-y-1 md:text-right">
                          <p className="font-bold text-sm text-terracotta-700">{fcfa(order.total_amount)}</p>
                          <div className="flex items-center md:justify-end gap-1.5">
                            <span className="text-onyx-muted">Mode :</span>
                            <span className="rounded bg-sand-100 px-2 py-0.5 font-bold text-onyx uppercase text-[10px]">
                              {order.payment_method === 'cod' ? 'Paiement à la livraison' : order.payment_method}
                            </span>
                          </div>
                          {order.payment_method === 'cod' && order.status !== 'delivered' && (
                            <p className="text-[10px] font-bold text-amber-700">À encaisser par le livreur : {fcfa(order.total_amount)}</p>
                          )}
                        </div>
                      </div>

                      {/* Items Ordered */}
                      <div className="border-t border-sand-100 pt-2 bg-sand-50/50 rounded-xl p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-onyx-light mb-1">Articles commandés :</p>
                        <div className="space-y-1 text-xs text-onyx">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span>• {item.quantity} × {item.product_name}</span>
                              <span className="font-semibold">{fcfa(item.unit_price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PRODUCTS & STOCK MANAGEMENT */}
        {/* ============================================================ */}
        {activeTab === 'products' && adminRole !== 'logistics' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-luxury-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-serif text-lg font-bold text-onyx">Catalogue Produits ({currentShopName})</h2>
                  <p className="text-xs text-onyx-muted">Ajustez les prix en FCFA, les quantités en stock ou supprimez des articles.</p>
                </div>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="rounded-xl bg-terracotta-500 hover:bg-terracotta-600 px-4 py-2 text-xs font-bold text-white shadow transition"
                >
                  + Nouveau Produit (Import Photo)
                </button>
              </div>

              {loadingProducts ? (
                <p className="text-xs text-onyx-muted py-6 text-center">Chargement des produits...</p>
              ) : (
                <div className="divide-y divide-sand-100">
                  {products.map((p) => (
                    <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sand-100 border border-sand-200">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs">Photo</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-onyx">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.shop && (
                              <span className="rounded bg-sand-100 px-2 py-0.5 text-[10px] font-semibold text-onyx">
                                🏪 {p.shop.name} ({p.shop.city})
                              </span>
                            )}
                            <span className="text-[10px] text-onyx-light">Slug : /{p.slug}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Stock editor */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-onyx-light font-medium">Stock :</span>
                          <input
                            type="number"
                            min="0"
                            defaultValue={p.stock}
                            onBlur={(e) => updateProductField(p.id, { stock: parseInt(e.target.value) || 0 })}
                            className="w-16 rounded-lg border border-sand-300 px-2 py-1 text-xs font-bold text-onyx text-center outline-none focus:border-terracotta-500"
                          />
                          <span className="text-[10px] text-onyx-light">Alerte sous</span>
                          <input type="number" min="0" defaultValue={p.low_stock_threshold ?? 5} onBlur={(e) => updateProductField(p.id, { low_stock_threshold: parseInt(e.target.value) || 0 })} className="w-14 rounded-lg border border-sand-300 px-2 py-1 text-xs text-center" aria-label={`Seuil d'alerte stock pour ${p.name}`} />
                        </div>

                        {/* Price editor */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-onyx-light font-medium">Prix :</span>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            defaultValue={p.price}
                            onBlur={(e) => updateProductField(p.id, { price: parseInt(e.target.value) || 0 })}
                            className="w-24 rounded-lg border border-sand-300 px-2 py-1 text-xs font-bold text-terracotta-700 text-center outline-none focus:border-terracotta-500"
                          />
                          <span className="text-xs font-bold text-onyx">FCFA</span>
                        </div>

                        {/* Active toggle */}
                        <button
                          onClick={() => updateProductField(p.id, { active: !p.active })}
                          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                            p.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {p.active ? 'Actif' : 'Masqué'}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="rounded-lg p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Supprimer ce produit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: ANALYTICS & VISUAL CHARTS & DIAGRAMS */}
        {/* ============================================================ */}
        {activeTab === 'stats' && adminRole !== 'logistics' && (
          <div className="space-y-6">
            {metrics && <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[['Commandes',metrics.orders],['À traiter',metrics.open_orders],['Livrées',metrics.delivered],['CA net',fcfa(metrics.revenue)],['Alertes stock',metrics.low_stock_count]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-sand-200 bg-white p-4"><p className="text-[10px] font-bold uppercase text-onyx-light">{label}</p><p className="mt-1 font-serif text-lg font-bold text-onyx">{value}</p></div>)}
            </div>}
            
            {/* Visual Charts & Diagrams via Chart.js */}
            <AdminCharts orders={orders} />

            {/* Row 2: Top Selling Products Table & Performance */}
            <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-luxury-sm space-y-4">
              <div className="flex items-center justify-between border-b border-sand-100 pb-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-onyx">Top Produits par Chiffre d'Affaires</h3>
                  <p className="text-xs text-onyx-muted">Volumes d'unités vendues pour {currentShopName}</p>
                </div>
                <span className="text-xs font-bold text-terracotta-600 uppercase">Classement Ventes</span>
              </div>

              {topProducts.length === 0 ? (
                <p className="text-xs text-onyx-muted py-6 text-center">Aucune vente enregistrée pour le moment.</p>
              ) : (
                <div className="divide-y divide-sand-100">
                  {topProducts.map(([name, data], idx) => {
                    const share = Math.round((data.revenue / (totalRevenue || 1)) * 100);
                    return (
                      <div key={name} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sand-100 font-bold text-onyx text-[11px]">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-onyx text-sm">{name}</p>
                            <p className="text-onyx-muted">{data.count} unité(s) vendue(s)</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-sm text-terracotta-700">{fcfa(data.revenue)}</p>
                          <span className="text-[10px] text-emerald-700 font-semibold">{share}% du CA</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'tools' && <div className="grid gap-6 lg:grid-cols-2">
          {adminRole !== 'logistics' && <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-luxury-sm">
            <h2 className="font-serif text-lg font-bold text-onyx">Alertes de stock bas</h2>
            {lowStock.length ? <ul className="mt-3 divide-y divide-sand-100">{lowStock.map(p=><li key={p.id} className="flex justify-between py-3 text-sm"><span>{p.name}</span><strong className="text-amber-700">{p.stock} restant(s), seuil {p.low_stock_threshold}</strong></li>)}</ul> : <p className="mt-3 text-sm text-emerald-700">Aucun produit sous le seuil.</p>}
          </section>}
          {adminRole !== 'logistics' && <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-luxury-sm">
            <h2 className="font-serif text-lg font-bold text-onyx">Créer un code promo</h2>
            <form onSubmit={saveCoupon} className="mt-3 grid gap-2 sm:grid-cols-2">
              <input required placeholder="CODE" value={couponDraft.code} onChange={e=>setCouponDraft({...couponDraft,code:e.target.value.toUpperCase()})} className="rounded-lg border border-sand-300 px-3 py-2 text-sm" />
              <select value={couponDraft.discount_type} onChange={e=>setCouponDraft({...couponDraft,discount_type:e.target.value})} className="rounded-lg border border-sand-300 px-3 py-2 text-sm"><option value="percent">Pourcentage</option><option value="fixed">Montant FCFA</option></select>
              <input required type="number" min="1" max={couponDraft.discount_type==='percent'?100:undefined} value={couponDraft.discount_value} onChange={e=>setCouponDraft({...couponDraft,discount_value:Number(e.target.value)})} className="rounded-lg border border-sand-300 px-3 py-2 text-sm" />
              <input type="number" min="0" placeholder="Commande minimum" value={couponDraft.minimum_order} onChange={e=>setCouponDraft({...couponDraft,minimum_order:Number(e.target.value)})} className="rounded-lg border border-sand-300 px-3 py-2 text-sm" />
              <input type="number" min="1" placeholder="Limite d'utilisation (facultatif)" value={couponDraft.usage_limit} onChange={e=>setCouponDraft({...couponDraft,usage_limit:e.target.value})} className="rounded-lg border border-sand-300 px-3 py-2 text-sm" />
              <label className="text-xs text-onyx-muted">Début <input type="datetime-local" value={couponDraft.starts_at} onChange={e=>setCouponDraft({...couponDraft,starts_at:e.target.value})} className="mt-1 w-full rounded-lg border border-sand-300 px-2 py-2" /></label>
              <label className="text-xs text-onyx-muted">Fin <input type="datetime-local" value={couponDraft.ends_at} onChange={e=>setCouponDraft({...couponDraft,ends_at:e.target.value})} className="mt-1 w-full rounded-lg border border-sand-300 px-2 py-2" /></label>
              <button className="rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-bold text-white">Créer le code</button>
            </form>
            <ul className="mt-4 divide-y divide-sand-100">{coupons.map(c=><li key={c.id} className="flex justify-between gap-2 py-2 text-sm"><span><strong>{c.code}</strong> · {c.discount_type==='percent'?`${c.discount_value}%`:fcfa(c.discount_value)} · {c.used_count} utilisé(s)</span><button onClick={()=>toggleCoupon(c)} className="font-semibold text-terracotta-700">{c.active?'Désactiver':'Activer'}</button></li>)}</ul>
          </section>}
          {adminRole !== 'owner' && <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-luxury-sm"><h2 className="font-serif text-lg font-bold text-onyx">Changer mon mot de passe</h2><form onSubmit={changeOwnPassword} className="mt-3 space-y-2"><input required type="password" placeholder="Mot de passe actuel" value={passwordChange.current_password} onChange={e=>setPasswordChange({...passwordChange,current_password:e.target.value})} className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"/><input required type="password" minLength={12} placeholder="Nouveau mot de passe" value={passwordChange.password} onChange={e=>setPasswordChange({...passwordChange,password:e.target.value})} className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"/><input required type="password" placeholder="Confirmer le nouveau mot de passe" value={passwordChange.password_confirmation} onChange={e=>setPasswordChange({...passwordChange,password_confirmation:e.target.value})} className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"/><button className="rounded-lg bg-onyx px-4 py-2 text-sm font-bold text-white">Mettre à jour</button></form></section>}
        </div>}

        {activeTab === 'users' && adminRole==='owner' && <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-luxury-sm">
            <h2 className="font-serif text-lg font-bold text-onyx">Comptes du back-office</h2>
            <form onSubmit={createAdminAccount} className="mt-4 grid gap-2 sm:grid-cols-2">
              <input required placeholder="Nom" value={adminDraft.name} onChange={e=>setAdminDraft({...adminDraft,name:e.target.value})} className="rounded-lg border border-sand-300 px-3 py-2 text-sm" />
              <input required type="email" placeholder="E-mail" value={adminDraft.email} onChange={e=>setAdminDraft({...adminDraft,email:e.target.value})} className="rounded-lg border border-sand-300 px-3 py-2 text-sm" />
              <select value={adminDraft.role} onChange={e=>setAdminDraft({...adminDraft,role:e.target.value})} className="rounded-lg border border-sand-300 px-3 py-2 text-sm"><option value="manager">Gestionnaire</option><option value="logistics">Logistique</option><option value="owner">Propriétaire</option></select>
              <input required type="password" minLength={12} placeholder="Mot de passe (12 caractères min.)" value={adminDraft.password} onChange={e=>setAdminDraft({...adminDraft,password:e.target.value})} className="rounded-lg border border-sand-300 px-3 py-2 text-sm" />
              <button className="rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-bold text-white">Créer le compte</button>
            </form>
            <ul className="mt-4 divide-y divide-sand-100">{adminAccounts.map(a=><li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span><strong>{a.name}</strong> · {a.email} · {a.role}</span><span className="flex gap-2"><button onClick={()=>resetAdminPassword(a)} className="text-terracotta-700">Réinitialiser MDP</button><button onClick={()=>toggleAdminAccount(a)} className="font-semibold">{a.active?'Désactiver':'Activer'}</button></span></li>)}</ul>
          </section>
          <div className="space-y-6">
            <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-luxury-sm"><h2 className="font-serif text-lg font-bold text-onyx">Changer mon mot de passe</h2><form onSubmit={changeOwnPassword} className="mt-3 space-y-2"><input required type="password" placeholder="Mot de passe actuel" value={passwordChange.current_password} onChange={e=>setPasswordChange({...passwordChange,current_password:e.target.value})} className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"/><input required type="password" minLength={12} placeholder="Nouveau mot de passe (12 caractères min.)" value={passwordChange.password} onChange={e=>setPasswordChange({...passwordChange,password:e.target.value})} className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"/><input required type="password" placeholder="Confirmer le nouveau mot de passe" value={passwordChange.password_confirmation} onChange={e=>setPasswordChange({...passwordChange,password_confirmation:e.target.value})} className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"/><button className="rounded-lg bg-onyx px-4 py-2 text-sm font-bold text-white">Mettre à jour</button></form></section>
            <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-luxury-sm"><h2 className="font-serif text-lg font-bold text-onyx">Journal récent</h2><ul className="mt-3 max-h-72 divide-y divide-sand-100 overflow-auto text-xs">{auditEntries.map(log=><li key={log.id} className="py-2"><strong>{log.admin?.name||'Compte supprimé'}</strong> · {log.action} · {log.subject_type} #{log.subject_id}<div className="text-onyx-light">{new Date(log.created_at).toLocaleString('fr-FR')}</div></li>)}</ul></section>
          </div>
        </div>}

      </div>

      {/* ============================================================ */}
      {/* MODAL: AJOUTER UN PRODUIT AVEC IMPORT D'IMAGE DIRECT */}
      {/* ============================================================ */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-onyx/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-sand-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600">Boutique & Confection</span>
                <h3 className="font-serif text-xl font-bold text-onyx">Ajouter un Nouveau Produit</h3>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="rounded-full bg-sand-100 p-2 text-onyx-muted hover:bg-sand-200 transition"
              >
                ✕
              </button>
            </div>

            {productError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
                {productError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              
              {/* Boutique Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-onyx mb-1">Boutique / Atelier Vendeur *</label>
                <select
                  required
                  value={newProduct.shop_id}
                  onChange={(e) => setNewProduct({ ...newProduct, shop_id: parseInt(e.target.value) })}
                  className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-onyx outline-none focus:border-terracotta-500"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city}) — WhatsApp : {s.whatsapp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-onyx mb-1">Nom du produit *</label>
                <input
                  required
                  value={newProduct.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewProduct({
                      ...newProduct,
                      name,
                      slug: slugify(name),
                    });
                  }}
                  placeholder="Ex. Boubou Soie Thioup Brodé"
                  className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-onyx outline-none focus:border-terracotta-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-onyx mb-1">Slug URL (unique) *</label>
                  <input
                    required
                    value={newProduct.slug}
                    onChange={(e) => setNewProduct({ ...newProduct, slug: slugify(e.target.value) })}
                    placeholder="boubou-soie-thioup"
                    className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-xs text-onyx outline-none focus:border-terracotta-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-onyx mb-1">Prix (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-terracotta-700 outline-none focus:border-terracotta-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-onyx mb-1">Stock Initial *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-xs font-bold text-onyx outline-none focus:border-terracotta-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-onyx">
                    <input
                      type="checkbox"
                      checked={newProduct.active}
                      onChange={(e) => setNewProduct({ ...newProduct, active: e.target.checked })}
                      className="rounded text-terracotta-600 focus:ring-terracotta-500 h-4 w-4"
                    />
                    <span>Actif en boutique</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-onyx mb-1">Description détaillée</label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Matières, broderie, coupe, occasion..."
                  className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-xs text-onyx outline-none focus:border-terracotta-500"
                />
              </div>

              {/* PHOTO SOURCE TABS: IMPORT FICHIER / PRESETS / URL */}
              <div className="space-y-3 rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-onyx">Photo du Produit *</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('upload')}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        imageUploadMode === 'upload' ? 'bg-terracotta-500 text-white' : 'bg-white text-onyx-muted border border-sand-200'
                      }`}
                    >
                      📁 Importer depuis l'appareil
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('preset')}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        imageUploadMode === 'preset' ? 'bg-terracotta-500 text-white' : 'bg-white text-onyx-muted border border-sand-200'
                      }`}
                    >
                      Galerie
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('url')}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        imageUploadMode === 'url' ? 'bg-terracotta-500 text-white' : 'bg-white text-onyx-muted border border-sand-200'
                      }`}
                    >
                      Lien Web
                    </button>
                  </div>
                </div>

                {/* Option 1: File Upload directly from computer / phone */}
                {imageUploadMode === 'upload' && (
                  <div className="space-y-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-sand-300 hover:border-terracotta-500 rounded-2xl p-4 text-center bg-white transition hover:bg-terracotta-50/30 flex flex-col items-center justify-center gap-2"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="h-10 w-10 rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-onyx">
                        {uploadingImage ? 'Téléversement en cours…' : 'Cliquez pour choisir une photo sur votre appareil'}
                      </p>
                      <p className="text-[10px] text-onyx-light">JPG, PNG, WEBP jusqu'à 10 Mo</p>
                    </div>
                  </div>
                )}

                {/* Option 2: Presets */}
                {imageUploadMode === 'preset' && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.label}
                        type="button"
                        onClick={() => {
                          setNewProduct({ ...newProduct, image_url: img.url });
                          setImagePreview(img.url);
                        }}
                        className={`relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 transition ${
                          newProduct.image_url === img.url ? 'border-terracotta-500 ring-2 ring-terracotta-300' : 'border-sand-200'
                        }`}
                      >
                        <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Option 3: URL input */}
                {imageUploadMode === 'url' && (
                  <input
                    type="url"
                    value={newProduct.image_url}
                    onChange={(e) => {
                      setNewProduct({ ...newProduct, image_url: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-xs text-onyx outline-none focus:border-terracotta-500"
                  />
                )}

                {/* Live Preview */}
                {imagePreview && (
                  <div className="flex items-center gap-3 pt-2 border-t border-sand-200">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="h-12 w-12 rounded-xl object-cover border border-sand-300"
                    />
                    <div className="text-[11px] text-onyx-muted truncate">
                      <span className="font-bold text-emerald-700">✓ Image prête</span>
                      <p className="truncate text-onyx-light max-w-xs">{newProduct.image_url}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-xs font-semibold text-onyx hover:bg-sand-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addingProduct || uploadingImage}
                  className="rounded-xl bg-terracotta-500 hover:bg-terracotta-600 px-6 py-2.5 text-xs font-bold text-white shadow transition disabled:opacity-50"
                >
                  {addingProduct ? 'Enregistrement…' : 'Enregistrer le Produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
