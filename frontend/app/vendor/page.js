'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSSE } from '@/contexts/SSEContext';
import { Package, ChefHat, BarChart3, LogOut } from 'lucide-react';

export default function VendorDashboard() {
  const router = useRouter();
  const { user, token, logout, loading: authLoading } = useAuth();
  const { storeStatus, updateStoreStatus } = useSSE();
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (user && user.role !== 'VENDOR') {
      router.push('/');
      return;
    }
  }, [token, user, authLoading, router]);

const toggleStoreStatus = async () => {
  const newStatus = !storeStatus;
  
  // Optimistic update
  updateStoreStatus(newStatus);
  
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campus-bites-server.vercel.app/api';
    
    const response = await fetch(`${API_URL}/store/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isOpen: newStatus })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Store status updated:', data.isOpen);
      // Confirm with server response
      updateStoreStatus(data.isOpen);
    } else {
      // Revert on error
      updateStoreStatus(!newStatus);
      const error = await response.json();
      console.error('❌ Failed to update store status:', error);
      alert('Failed to update store status');
    }
  } catch (error) {
    // Revert on error
    updateStoreStatus(!newStatus);
    console.error('❌ Error updating store status:', error);
    alert('Failed to update store status. Please check your connection.');
  }
};

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'VENDOR') return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground">Vendor Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your orders, menu items, and track status</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Store Status Toggle */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                <span className="text-sm font-semibold">Store:</span>
                <button
                  onClick={toggleStoreStatus}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    storeStatus ? 'bg-success' : 'bg-destructive'
                  }`}
                  title={storeStatus ? 'Click to close store' : 'Click to open store'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      storeStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-bold ${storeStatus ? 'text-success' : 'text-destructive'}`}>
                  {storeStatus ? 'Open' : 'Closed'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'orders'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="w-5 h-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'menu'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ChefHat className="w-5 h-5" />
            Menu Items
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'status'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Status
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && <OrdersManagement token={token} />}
        {activeTab === 'menu' && <MenuManagement token={token} />}
        {activeTab === 'status' && <StatusOverview token={token} />}
      </div>
    </div>
  );
}
// ========================= Orders Management =========================
function OrdersManagement({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('https://campus-bites-server.vercel.app/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`https://campus-bites-server.vercel.app/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrders();
        alert(`Order #${orderId} updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-elegant border border-border">
        <h2 className="font-serif text-lg sm:text-xl font-bold mb-4">Orders Management</h2>
        <p className="text-sm text-muted-foreground mb-6">View and manage all incoming orders</p>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-xl overflow-hidden bg-muted/20">
                {/* ⭐ Order Header - Mobile Optimized */}
                <div className="p-4">
                  {/* Top Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID</p>
                      <p className="font-bold text-foreground">#{order.id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                      order.status === 'READY' ? 'bg-blue-500/10 text-blue-600' :
                      order.status === 'PROCESSING' ? 'bg-yellow-500/10 text-yellow-600' :
                      order.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Customer & Date Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-medium text-foreground truncate">
                        {order.user?.name || order.user?.email}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm text-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Items & Total Row */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => toggleOrderDetails(order.id)}
                      className="flex items-center gap-2 text-secondary font-medium hover:underline"
                    >
                      <span className="text-sm">{order.items?.length || 0} items</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedOrder === order.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold text-lg text-secondary">₹{parseFloat(order.total).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Status Update Dropdown */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Update Status</p>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="READY">Ready</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* ⭐ Expandable Order Items - Improved Mobile */}
                {expandedOrder === order.id && (
                  <div className="border-t border-border bg-card">
                    <div className="p-4">
                      <h4 className="font-semibold mb-3 text-foreground text-sm">Order Items:</h4>
                      <div className="space-y-3">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, index) => (
                            <div
                              key={index}
                              className="bg-muted/50 rounded-lg p-3 border border-border"
                            >
                              {/* Mobile: Stack vertically */}
                              <div className="flex items-start gap-3 mb-2">
                                {item.menuItem?.imageUrl && (
                                  <img
                                    src={item.menuItem.imageUrl}
                                    alt={item.menuItem.name}
                                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground text-sm truncate">
                                    {item.menuItem?.name || 'Unknown Item'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.menuItem?.category}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Details Row */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <span className="text-muted-foreground">Qty: </span>
                                    <span className="font-semibold text-foreground">{item.quantity}x</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Price: </span>
                                    <span className="font-semibold text-foreground">
                                      ₹{parseFloat(item.price || item.menuItem?.price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                <div className="font-bold text-foreground">
                                  ₹{(parseFloat(item.price || item.menuItem?.price || 0) * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center py-4 text-sm">No items found</p>
                        )}
                      </div>
                      
                      {/* Order Summary */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-foreground">Order Total:</p>
                          <p className="text-xl font-bold text-secondary">₹{parseFloat(order.total).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================= Menu Management =========================
function MenuManagement({ token }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Pizza',
    imageUrl: '',
    isAvailable: true,
    popular: false
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campus-bites-server.vercel.app/api';

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`${API_URL}/menu/items`);
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '' });
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      return data.imageUrl || data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Proceeding without image.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUploading(true);

      // Upload image if a new file is selected
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const url = editingItem 
        ? `${API_URL}/menu/items/${editingItem.id}`
        : `${API_URL}/menu/items`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        isAvailable: formData.isAvailable,
        popular: formData.popular,
        stock: 100
      };

      // Only include imageUrl if it exists
      if (imageUrl) {
        payload.imageUrl = imageUrl;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(editingItem ? 'Item updated successfully!' : 'Item created successfully!');
        setShowModal(false);
        setEditingItem(null);
        resetForm();
        fetchMenuItems();
      } else {
        const errorData = await response.json();
        alert(`Failed to save item: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert(`Failed to save item: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      popular: item.popular
    });
    
    // Set preview to existing image
    if (item.imageUrl) {
      setImagePreview(item.imageUrl);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${API_URL}/menu/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Item deleted successfully!');
        fetchMenuItems();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete item: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert(`Failed to delete item: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Pizza',
      imageUrl: '',
      isAvailable: true,
      popular: false
    });
    setImageFile(null);
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-serif text-xl font-bold">Menu Items Management</h2>
            <p className="text-muted-foreground">Add, edit, or remove items from your menu</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
          >
            + Add Item
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div key={item.id} className="border border-border rounded-xl p-4">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-4xl">🍽️</span>
                </div>
              )}
              <h3 className="font-bold text-lg mb-1">{item.name}</h3>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-secondary">₹{parseFloat(item.price).toFixed(2)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  item.isAvailable ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 bg-muted text-foreground py-2 rounded-lg text-sm font-semibold hover:bg-border transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 bg-destructive text-destructive-foreground py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-border">
            <h3 className="font-serif text-2xl font-bold mb-4">
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-secondary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-secondary"
                  rows="3"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-secondary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="Pizza">Pizza</option>
                  <option value="Rolls">Rolls</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Sandwiches">Sandwiches</option>
                  <option value="Snacks">Snacks</option>
                </select>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Item Image <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full hover:opacity-90 transition"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-secondary transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-semibold text-foreground">Click to upload image</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold">Available</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => setFormData({...formData, popular: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold">Popular</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="flex-1 bg-muted text-foreground py-2 rounded-lg font-semibold hover:bg-border transition"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    editingItem ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// ========================= Status Overview =========================
function StatusOverview({ token }) {
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    ready: 0,
    completed: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('https://campus-bites-server.vercel.app/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const orders = data.orders || [];

      const stats = {
        pending: orders.filter(o => o.status === 'PENDING').length,
        processing: orders.filter(o => o.status === 'PROCESSING').length,
        ready: orders.filter(o => o.status === 'READY').length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        totalRevenue: orders
          .filter(o => o.status === 'COMPLETED')
          .reduce((sum, o) => sum + parseFloat(o.total), 0)
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
          <p className="text-muted-foreground mb-2">Pending Orders</p>
          <p className="text-4xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
          <p className="text-muted-foreground mb-2">Processing</p>
          <p className="text-4xl font-bold text-blue-500">{stats.processing}</p>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
          <p className="text-muted-foreground mb-2">Ready for Pickup</p>
          <p className="text-4xl font-bold text-success">{stats.ready}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
        <h3 className="font-serif text-xl font-bold mb-4">Today's Revenue</h3>
        <p className="text-5xl font-bold text-secondary">₹{stats.totalRevenue.toFixed(2)}</p>
        <p className="text-muted-foreground mt-2">{stats.completed} completed orders</p>
      </div>
    </div>
  );
}