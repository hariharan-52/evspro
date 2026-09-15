export const DONATION_CATEGORIES = ['Furniture', 'Books', 'Clothes', 'Electronics', 'Household Items', 'Other'];
export const RECYCLING_CATEGORIES = ['Plastic', 'Paper', 'Metal', 'Glass', 'E-Waste', 'Cardboard', 'Other'];
export const DONATION_CONDITIONS = ['New', 'Like New', 'Good', 'Usable'];

export const DONATION_STATUSES = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PICKUP_SCHEDULED: 'Pickup Scheduled',
  RECEIVED: 'Received',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected'
};

export const RECYCLING_STATUSES = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PICKUP_SCHEDULED: 'Pickup Scheduled',
  COLLECTED: 'Collected',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected'
};

export const STATUS_COLORS = {
  PENDING: 'yellow',
  ACCEPTED: 'blue',
  PICKUP_SCHEDULED: 'purple',
  RECEIVED: 'indigo',
  COLLECTED: 'indigo',
  COMPLETED: 'green',
  REJECTED: 'red'
};

export const API_URL = import.meta.env.VITE_API_URL || '/api';
