import dayjs from 'dayjs';

export const formatNPR = (amount) => {
  if (amount === undefined || amount === null) return 'NPR 0.00';
  return `NPR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  if (!date) return '—';
  return dayjs(date).format('DD MMM YYYY');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
};

export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'safe', label: 'Safe', color: 'green', urgent: false };
  
  const today = dayjs().startOf('day');
  const expiry = dayjs(expiryDate).startOf('day');
  const daysLeft = expiry.diff(today, 'day');

  if (daysLeft < 0) return { status: 'expired', label: 'Expired', color: 'red', urgent: true };
  if (daysLeft <= 30) return { status: 'expiring_30', label: `${daysLeft}d`, color: 'red', urgent: true };
  if (daysLeft <= 60) return { status: 'expiring_60', label: `${daysLeft}d`, color: 'amber', urgent: false };
  if (daysLeft <= 90) return { status: 'expiring_90', label: `${daysLeft}d`, color: 'yellow', urgent: false };
  return { status: 'safe', label: 'Safe', color: 'green', urgent: false };
};
