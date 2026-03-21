export const getStockStatus = (currentStock, lowThreshold = 10, highThreshold = 500) => {
  if (currentStock === 0) return { status: 'out_of_stock', color: 'red', label: 'Out of stock' };
  if (currentStock < lowThreshold * 0.5) return { status: 'critical', color: 'red', label: 'Critical' };
  if (currentStock < lowThreshold) return { status: 'low', color: 'amber', label: 'Low stock' };
  if (currentStock > highThreshold * 2) return { status: 'overstock', color: 'purple', label: 'Overstock' };
  if (currentStock > highThreshold) return { status: 'high', color: 'blue', label: 'High stock' };
  return { status: 'normal', color: 'green', label: 'Normal' };
};

export const getBadgeColor = (colorCode) => {
  const map = {
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return map[colorCode] || map.gray;
};
