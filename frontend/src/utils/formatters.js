import dayjs from 'dayjs';
import NepaliDate from 'nepali-date-converter';
import { useSettingsStore } from '@/stores/settingsStore';

export const formatNPR = (amount) => {
  if (amount === undefined || amount === null) return 'NPR 0.00';
  return `NPR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const _formatDateBase = (date, formatStr) => {
  if (!date) return '—';
  const dp = new Date(date);
  const sys = useSettingsStore.getState().dateSystem;
  
  if (sys === 'BS') {
    try {
      const nd = new NepaliDate(dp);
      // 'DD MMMM YYYY' in english for nepali months
      if (formatStr.includes('hh:mm')) {
        return nd.format('DD MMMM YYYY', 'en') + ', ' + dayjs(dp).format('hh:mm A');
      }
      return nd.format('DD MMMM YYYY', 'en');
    } catch(e) {
      return dayjs(dp).format(formatStr); // fallback if parsing fails
    }
  }
  return dayjs(dp).format(formatStr);
};

export const formatDate = (date) => _formatDateBase(date, 'DD MMM YYYY');

export const formatDateTime = (date) => _formatDateBase(date, 'DD MMM YYYY, hh:mm A');

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
