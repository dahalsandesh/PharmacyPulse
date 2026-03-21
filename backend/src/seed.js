require('dotenv').config();
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const User = require('./models/User');
const Pharmacy = require('./models/Pharmacy');
const Medicine = require('./models/Medicine');
const Batch = require('./models/Batch');
const Supplier = require('./models/Supplier');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if superadmin exists
    const existingSuperadmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperadmin) {
      console.log('⚠️  Superadmin already exists. Skipping seed.');
      await mongoose.disconnect();
      return;
    }

    // Create superadmin
    const superadmin = await User.create({
      name: 'Super Admin',
      email: 'admin@medstore.com',
      password: 'admin123',
      role: 'superadmin',
      isActive: true,
    });
    console.log('✅ Superadmin created: admin@medstore.com / admin123');

    // Create demo pharmacy
    const pharmacy = await Pharmacy.create({
      name: 'MedStore Pharmacy - Kathmandu',
      address: 'Putalisadak, Kathmandu',
      phone: '01-4234567',
      email: 'kathmandu@medstore.com',
      ownerName: 'Ram Sharma',
      subscription: { plan: 'premium', isActive: true, startDate: new Date() },
    });
    console.log('✅ Demo pharmacy created:', pharmacy.name);

    // Create admin user for pharmacy
    const admin = await User.create({
      name: 'Ram Sharma',
      email: 'ram@medstore.com',
      password: 'admin123',
      role: 'admin',
      pharmacyId: pharmacy._id,
      isActive: true,
    });
    console.log('✅ Pharmacy admin created: ram@medstore.com / admin123');

    // Create staff user
    const staff = await User.create({
      name: 'Sita Gurung',
      email: 'sita@medstore.com',
      password: 'staff123',
      role: 'staff',
      pharmacyId: pharmacy._id,
      isActive: true,
    });
    console.log('✅ Staff user created: sita@medstore.com / staff123');

    // Create supplier
    const supplier = await Supplier.create({
      pharmacyId: pharmacy._id,
      name: 'Nepal Pharma Distributors',
      contactPerson: 'Hari Bahadur',
      phone: '9841234567',
      address: 'New Baneshwor, Kathmandu',
    });
    console.log('✅ Supplier created:', supplier.name);

    // Create demo medicines
    const medicines = [
      { name: 'Paracetamol 500mg', genericName: 'Paracetamol', category: 'analgesic', unit: 'tablet', lowStockThreshold: 20, highStockThreshold: 500 },
      { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'antibiotic', unit: 'capsule', lowStockThreshold: 15, highStockThreshold: 300 },
      { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'antacid', unit: 'capsule', lowStockThreshold: 10, highStockThreshold: 200 },
      { name: 'ORS Sachet (Jeevan Jal)', genericName: 'ORS', category: 'ors', unit: 'sachet', lowStockThreshold: 25, highStockThreshold: 500 },
      { name: 'Cetirizine 10mg', genericName: 'Cetirizine', category: 'other', unit: 'tablet', lowStockThreshold: 10, highStockThreshold: 300 },
      { name: 'Metformin 500mg', genericName: 'Metformin', category: 'antidiabetic', unit: 'tablet', lowStockThreshold: 15, highStockThreshold: 200 },
      { name: 'Azithromycin 250mg', genericName: 'Azithromycin', category: 'antibiotic', unit: 'capsule', lowStockThreshold: 10, highStockThreshold: 200 },
      { name: 'Calcium + Vitamin D', genericName: 'Calcium + Cholecalciferol', category: 'vitamin', unit: 'tablet', lowStockThreshold: 15, highStockThreshold: 400 },
    ];

    const createdMedicines = [];
    for (const med of medicines) {
      const m = await Medicine.create({ ...med, pharmacyId: pharmacy._id });
      createdMedicines.push(m);
    }
    console.log(`✅ ${createdMedicines.length} demo medicines created`);

    // Create demo batches with varied expiry + stock levels
    const batchData = [
      { medIdx: 0, batchNumber: 'B2025-01', purchasePrice: 2, sellingPrice: 5, initialQuantity: 3, expiryMonths: 8 },    // Critical stock
      { medIdx: 1, batchNumber: 'B2024-01', purchasePrice: 15, sellingPrice: 45, initialQuantity: 48, expiryMonths: 1 },   // Expiring soon
      { medIdx: 1, batchNumber: 'B2025-04', purchasePrice: 16, sellingPrice: 45, initialQuantity: 200, expiryMonths: 18 },
      { medIdx: 2, batchNumber: 'B2025-02', purchasePrice: 8, sellingPrice: 22, initialQuantity: 6, expiryMonths: 5 },     // Low stock
      { medIdx: 3, batchNumber: 'B2025-02', purchasePrice: 5, sellingPrice: 18, initialQuantity: 200, expiryMonths: 2 },    // Expiring
      { medIdx: 3, batchNumber: 'B2025-05', purchasePrice: 5, sellingPrice: 18, initialQuantity: 300, expiryMonths: 20 },
      { medIdx: 4, batchNumber: 'B2025-01', purchasePrice: 3, sellingPrice: 12, initialQuantity: 60, expiryMonths: 3 },
      { medIdx: 5, batchNumber: 'B2024-03', purchasePrice: 4, sellingPrice: 15, initialQuantity: 120, expiryMonths: 1.5 },  // Expiring
      { medIdx: 5, batchNumber: 'B2025-06', purchasePrice: 4, sellingPrice: 15, initialQuantity: 340, expiryMonths: 12 },   // Overstock
      { medIdx: 6, batchNumber: 'B2025-03', purchasePrice: 20, sellingPrice: 55, initialQuantity: 30, expiryMonths: 4 },
      { medIdx: 7, batchNumber: 'B2025-07', purchasePrice: 6, sellingPrice: 18, initialQuantity: 150, expiryMonths: 15 },
    ];

    for (const bd of batchData) {
      await Batch.create({
        pharmacyId: pharmacy._id,
        medicineId: createdMedicines[bd.medIdx]._id,
        supplierId: supplier._id,
        batchNumber: bd.batchNumber,
        expiryDate: dayjs().add(bd.expiryMonths, 'month').endOf('month').toDate(),
        purchasePrice: bd.purchasePrice,
        sellingPrice: bd.sellingPrice,
        initialQuantity: bd.initialQuantity,
        quantity: bd.initialQuantity,
      });
    }
    console.log(`✅ ${batchData.length} demo batches created`);

    console.log('\n========================================');
    console.log('🎉 Seed complete!');
    console.log('========================================');
    console.log('Super Admin: admin@medstore.com / admin123');
    console.log('Pharmacy Admin: ram@medstore.com / admin123');
    console.log('Staff: sita@medstore.com / staff123');
    console.log('========================================\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();
