const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper to get token
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Generic fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Handle errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Error: ${response.status}`);
  }

  return response.json();
}

// API methods
export const api = {
  // Auth
  signup: (name, email, password) => 
    apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Menu
  getMenuItems: () => apiFetch('/menu/items'),
  
  getMenuItem: (id) => apiFetch(`/menu/items/${id}`),

  // Orders
  checkout: (totalAmount, items) =>
    apiFetch('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ totalAmount, items }),
    }),

  confirmOrder: (totalAmount, items, paymentIntentId) =>
    apiFetch('/orders/confirm', {
      method: 'POST',
      body: JSON.stringify({ totalAmount, items, paymentIntentId }),
    }),

  getOrders: () => apiFetch('/orders'),

  getOrder: (id) => apiFetch(`/orders/${id}`),

  updateOrderStatus: (id, status) =>
    apiFetch(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // User
  getProfile: () => apiFetch('/users/profile'),

  updateProfile: (name) =>
    apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  // Vendor - Menu Management
  createMenuItem: (data) =>
    apiFetch('/menu/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMenuItem: (id, data) =>
    apiFetch(`/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMenuItem: (id) =>
    apiFetch(`/menu/items/${id}`, {
      method: 'DELETE',
    }),

  // Upload
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = getToken();
    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },
};

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// export const api = {
//   async signup(name, email, password) {
//     const res = await fetch(`${API_URL}/auth/signup`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ name, email, password }),
//     });
//     if (!res.ok) {
//       const error = await res.json();
//       throw new Error(error.message || 'Signup failed');
//     }
//     return res.json();
//   },

//   async login(email, password) {
//     const res = await fetch(`${API_URL}/auth/login`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password }),
//     });
//     if (!res.ok) {
//       const error = await res.json();
//       throw new Error(error.message || 'Login failed');
//     }
//     return res.json();
//   },

//   async getMenuItems() {
//     const res = await fetch(`${API_URL}/menu`);
//     if (!res.ok) throw new Error('Failed to fetch menu items');
//     return res.json();
//   },
// };