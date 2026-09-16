import { format } from 'date-fns';
import { STATUS_COLORS } from './constants';

export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM dd, yyyy h:mm a');
};

export const getStatusColor = (status) => {
  const normalizedStatus = status ? status.toUpperCase().replace(' ', '_') : 'PENDING';
  return STATUS_COLORS[normalizedStatus] || 'gray';
};

export const generateAvatarUrl = (name) => {
  if (!name) return `https://ui-avatars.com/api/?name=User&background=16a34a&color=fff`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=16a34a&color=fff`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const truncateText = (text, maxLen = 50) => {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
};

export const CATEGORY_IMAGE_MAP = {
  // Donation categories
  'Furniture': 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&auto=format&fit=crop&q=80',
  'Books': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
  'Clothes': 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&auto=format&fit=crop&q=80',
  'Electronics': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
  'Household Items': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80',
  'Toys': 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
  'Food': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
  'Medical Supplies': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
  'Other': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',

  // Recycling waste categories
  'Plastic': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
  'Paper': 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
  'Cardboard': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
  'Metal': 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=800&auto=format&fit=crop&q=80',
  'E-Waste': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
  'Glass': 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=800&auto=format&fit=crop&q=80',
  'Organic': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
  'Textile': 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&auto=format&fit=crop&q=80'
};

// Curated realistic sample images by category for instant 1-click selection during donation/recycling creation
export const CATEGORY_PRESET_IMAGES = {
  'Furniture': [
    { label: 'Study Desk & Chair', url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&auto=format&fit=crop&q=80' },
    { label: 'Wooden Table', url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&auto=format&fit=crop&q=80' },
    { label: 'Sofa / Couch', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80' },
    { label: 'Bookshelf / Rack', url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80' }
  ],
  'Books': [
    { label: 'Academic Textbooks', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80' },
    { label: 'Story & Novels', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80' },
    { label: 'Kids & School Books', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80' }
  ],
  'Clothes': [
    { label: 'Winter Blankets & Jackets', url: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&auto=format&fit=crop&q=80' },
    { label: 'Warm Sweaters & Apparel', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80' },
    { label: 'Neatly Folded Clothes', url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=80' }
  ],
  'Electronics': [
    { label: 'Desk Lamps & Power Strips', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80' },
    { label: 'Small Appliances & Gadgets', url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80' },
    { label: 'Monitor & Accessories', url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=80' }
  ],
  'Household Items': [
    { label: 'Kitchen Cookware & Utensils', url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80' },
    { label: 'Storage Boxes & Home Decor', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80' }
  ],
  'Toys': [
    { label: 'Kids Educational Toys', url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80' },
    { label: 'Board Games & Plushies', url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80' }
  ],
  'Plastic': [
    { label: 'PET Bottles & Containers', url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80' },
    { label: 'Plastic Crates & Drums', url: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?w=800&auto=format&fit=crop&q=80' }
  ],
  'E-Waste': [
    { label: 'Circuit Boards & Old Parts', url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80' },
    { label: 'Computer Scrap & Wires', url: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=800&auto=format&fit=crop&q=80' }
  ],
  'Metal': [
    { label: 'Metal Scrap & Pipes', url: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=800&auto=format&fit=crop&q=80' },
    { label: 'Aluminum Cans & Frames', url: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&auto=format&fit=crop&q=80' }
  ],
  'Cardboard': [
    { label: 'Cardboard Cartons & Boxes', url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80' }
  ]
};

const MOCK_IMAGE_MAP = {
  'mock-furniture.jpg': 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&auto=format&fit=crop&q=80',
  'mock-books.jpg': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
  'mock-clothes.jpg': 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&auto=format&fit=crop&q=80',
  'mock-electronics.jpg': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
  'mock-plastic.jpg': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
  'mock-ewaste.jpg': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
  'mock-metal.jpg': 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=800&auto=format&fit=crop&q=80',
  'mock-cardboard.jpg': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80'
};

export const getItemImageUrl = (image, category = 'Other') => {
  if (image) {
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:image')) {
      return image;
    }
    const cleanName = image.replace(/^\/+/, '');
    if (MOCK_IMAGE_MAP[cleanName]) {
      return MOCK_IMAGE_MAP[cleanName];
    }
    const backendBase = import.meta.env.VITE_BACKEND_URL || '';
    return `${backendBase}/uploads/${cleanName}`;
  }
  return CATEGORY_IMAGE_MAP[category] || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80';
};

