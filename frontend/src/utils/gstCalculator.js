// Nepal GST Rates (as of 2024)
const GST_RATES = {
  ESSENTIAL_MEDICINES: 0,      // 0% for essential medicines
  LIFE_SAVING_DRUGS: 0,        // 0% for life-saving drugs
  MEDICAL_DEVICES: 13,         // 13% for medical devices
  NON_ESSENTIAL_MEDICINES: 13, // 13% for non-essential medicines
  GENERAL: 13                  // 13% standard rate
};

// Medicine categories for GST calculation
const MEDICINE_CATEGORIES = {
  ESSENTIAL: 'essential',           // Essential medicines - 0% GST
  LIFE_SAVING: 'life-saving',       // Life-saving drugs - 0% GST
  NON_ESSENTIAL: 'non-essential',   // Non-essential medicines - 13% GST
  MEDICAL_DEVICE: 'medical-device', // Medical devices - 13% GST
  GENERAL: 'general'                // General items - 13% GST
};

// Common essential medicines list (simplified - in production, this would come from database)
const ESSENTIAL_MEDICINES_LIST = [
  'paracetamol', 'ibuprofen', 'aspirin', 'amoxicillin', 'azithromycin',
  'cetrizine', 'dextromethorphan', 'salbutamol', 'metformin', 'atenolol'
];

// Life-saving drugs list (simplified)
const LIFE_SAVING_DRUGS_LIST = [
  'insulin', 'adrenaline', 'dopamine', 'nitroglycerin', 'epinephrine',
  'heparin', 'warfarin', 'digoxin', 'morphine', 'fentanyl'
];

export const getMedicineCategory = (medicineName, medicineCategory = null) => {
  const name = medicineName.toLowerCase();
  
  // If category is explicitly provided, use it
  if (medicineCategory) {
    return medicineCategory;
  }
  
  // Check life-saving drugs first (more specific)
  if (LIFE_SAVING_DRUGS_LIST.some(drug => name.includes(drug))) {
    return MEDICINE_CATEGORIES.LIFE_SAVING;
  }
  
  // Check essential medicines
  if (ESSENTIAL_MEDICINES_LIST.some(med => name.includes(med))) {
    return MEDICINE_CATEGORIES.ESSENTIAL;
  }
  
  // Default to non-essential for medicines
  return MEDICINE_CATEGORIES.NON_ESSENTIAL;
};

export const getGSTRate = (medicineName, medicineCategory = null) => {
  const category = getMedicineCategory(medicineName, medicineCategory);
  
  switch (category) {
    case MEDICINE_CATEGORIES.ESSENTIAL:
    case MEDICINE_CATEGORIES.LIFE_SAVING:
      return GST_RATES.ESSENTIAL_MEDICINES;
    case MEDICINE_CATEGORIES.NON_ESSENTIAL:
      return GST_RATES.NON_ESSENTIAL_MEDICINES;
    case MEDICINE_CATEGORIES.MEDICAL_DEVICE:
      return GST_RATES.MEDICAL_DEVICES;
    default:
      return GST_RATES.GENERAL;
  }
};

export const calculateGST = (amount, gstRate) => {
  return (amount * gstRate) / 100;
};

export const calculateGSTBreakdown = (items) => {
  const breakdown = {
    taxable: 0,
    exempt: 0,
    gst_0: 0,
    gst_13: 0,
    total_gst: 0,
    total_amount: 0,
    items: []
  };

  items.forEach(item => {
    const itemTotal = item.unitPrice * item.quantity;
    const gstRate = getGSTRate(item.medicineName, item.category);
    const gstAmount = calculateGST(itemTotal, gstRate);
    const itemTotalWithGST = itemTotal + gstAmount;

    const itemBreakdown = {
      ...item,
      gstRate,
      gstAmount,
      totalWithGST: itemTotalWithGST,
      isExempt: gstRate === 0
    };

    breakdown.items.push(itemBreakdown);
    breakdown.total_amount += itemTotalWithGST;
    breakdown.total_gst += gstAmount;

    if (gstRate === 0) {
      breakdown.exempt += itemTotal;
      breakdown.gst_0 += itemTotal;
    } else {
      breakdown.taxable += itemTotal;
      breakdown.gst_13 += gstAmount;
    }
  });

  return breakdown;
};

export const generateGSTInvoiceData = (saleData, pharmacyInfo) => {
  const gstBreakdown = calculateGSTBreakdown(saleData.items);
  
  return {
    invoiceNumber: saleData.invoiceNumber,
    invoiceDate: saleData.saleDate,
    pharmacyInfo: {
      name: pharmacyInfo.name,
      address: pharmacyInfo.address,
      phone: pharmacyInfo.phone,
      panNumber: pharmacyInfo.panNumber,
      gstNumber: pharmacyInfo.gstNumber
    },
    customerInfo: saleData.customerInfo || {},
    items: gstBreakdown.items,
    summary: {
      subtotal: gstBreakdown.taxable + gstBreakdown.exempt,
      taxableAmount: gstBreakdown.taxable,
      exemptAmount: gstBreakdown.exempt,
      gst_13: gstBreakdown.gst_13,
      totalGST: gstBreakdown.total_gst,
      totalAmount: gstBreakdown.total_amount,
      discount: saleData.discount || 0,
      netAmount: gstBreakdown.total_amount - (saleData.discount || 0)
    },
    paymentMethod: saleData.paymentMethod,
    soldBy: saleData.soldBy
  };
};

export const formatGSTAmount = (amount) => {
  return new Intl.NumberFormat('ne-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const validateGSTNumber = (gstNumber) => {
  // Nepal GST number validation (simplified)
  const gstRegex = /^[0-9]{9}$/;
  return gstRegex.test(gstNumber);
};

export const validatePANNumber = (panNumber) => {
  // Nepal PAN number validation (simplified)
  const panRegex = /^[0-9]{9}$/;
  return panRegex.test(panNumber);
};

export const getGSTLabel = (gstRate) => {
  switch (gstRate) {
    case 0:
      return 'Exempt';
    case 13:
      return '13% GST';
    default:
      return `${gstRate}% GST`;
  }
};
