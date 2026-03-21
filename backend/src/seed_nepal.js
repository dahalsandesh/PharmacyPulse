const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('./models/Medicine');
const Batch = require('./models/Batch');
const Pharmacy = require('./models/Pharmacy');
const Supplier = require('./models/Supplier');
const User = require('./models/User');
const Catalog = require('./models/Catalog');

dotenv.config();

const manufacturers = [
  { name: 'Deurali-Janta Pharmaceuticals', country: 'Nepal', logo: 'https://via.placeholder.com/150?text=DJPL' },
  { name: 'Magnus Pharma', country: 'Nepal', logo: 'https://via.placeholder.com/150?text=Magnus' },
  { name: 'Quest Pharmaceuticals', country: 'Nepal', logo: 'https://via.placeholder.com/150?text=Quest' },
  { name: 'Asian Pharmaceuticals', country: 'Nepal', logo: 'https://via.placeholder.com/150?text=Asian' },
  { name: 'Lomus Pharmaceuticals', country: 'Nepal', logo: 'https://via.placeholder.com/150?text=Lomus' },
  { name: 'Cipla Ltd.', country: 'India (Imported)', logo: 'https://via.placeholder.com/150?text=Cipla' },
  { name: 'Sun Pharma', country: 'India (Imported)', logo: 'https://via.placeholder.com/150?text=Sun' }
];

const medicines = [
  { 
    name: 'Cetamol', 
    genericName: 'Paracetamol', 
    category: 'Analgesic', 
    type: 'tablet', 
    manufacturer: 'Deurali-Janta Pharmaceuticals', 
    unit: 'tablet',
    sellingPrice: 2,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop'
  },
  { 
    name: 'Jeevan Jal', 
    genericName: 'Oral Rehydration Salt', 
    category: 'Antacid', 
    type: 'powder', 
    manufacturer: 'Deurali-Janta Pharmaceuticals', 
    unit: 'sachet',
    sellingPrice: 15,
    image: 'https://images.unsplash.com/photo-1550572017-ed200f545dec?w=200&h=200&fit=crop'
  },
  { 
    name: 'Flexon', 
    genericName: 'Ibuprofen + Paracetamol', 
    category: 'Analgesic', 
    type: 'tablet', 
    manufacturer: 'Magnus Pharma', 
    unit: 'tablet',
    sellingPrice: 5,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=200&h=200&fit=crop'
  },
  { 
    name: 'Pantop-40', 
    genericName: 'Pantoprazole', 
    category: 'Antacid', 
    type: 'tablet', 
    manufacturer: 'Quest Pharmaceuticals', 
    unit: 'tablet',
    sellingPrice: 10,
    image: 'https://images.unsplash.com/photo-1471864190281-ad5fe9afef72?w=200&h=200&fit=crop'
  },
  { 
    name: 'Azithral 500', 
    genericName: 'Azithromycin', 
    category: 'Antibiotic', 
    type: 'tablet', 
    manufacturer: 'Asian Pharmaceuticals', 
    unit: 'tablet',
    sellingPrice: 35,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop'
  },
  { 
    name: 'Sinex', 
    genericName: 'Paracetamol + Phenylephrine', 
    category: 'Analgesic', 
    type: 'tablet', 
    manufacturer: 'Lomus Pharmaceuticals', 
    unit: 'tablet',
    sellingPrice: 8,
    image: 'https://images.unsplash.com/photo-1576091160550-217359f4ecf8?w=200&h=200&fit=crop'
  }
];

async function seedNepalData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first pharmacy and admin user to associate data with
    const pharmacy = await Pharmacy.findOne();
    if (!pharmacy) {
      console.log('No pharmacy found. Please run main seed first.');
      process.exit(1);
    }

    const admin = await User.findOne({ pharmacyId: pharmacy._id, role: 'admin' });
    if (!admin) {
      console.log('No admin user found for the pharmacy.');
      process.exit(1);
    }

    // Seed Catalog Metadata
    console.log('Seeding Catalog Metadata...');
    for (const mfr of manufacturers) {
      await Catalog.findOneAndUpdate(
        { pharmacyId: pharmacy._id, type: 'manufacturer', name: mfr.name },
        { image: mfr.logo, description: `${mfr.country} pharmaceutical company` },
        { upsert: true }
      );
    }
    
    // Seed some categories and types too
    const catData = [
      { name: 'Analgesic', image: 'https://cdn-icons-png.flaticon.com/512/2311/2311745.png' },
      { name: 'Antibiotic', image: 'https://cdn-icons-png.flaticon.com/512/2904/2904123.png' },
      { name: 'Antacid', image: 'https://cdn-icons-png.flaticon.com/512/3020/3020129.png' }
    ];
    for (const cat of catData) {
      await Catalog.findOneAndUpdate(
        { pharmacyId: pharmacy._id, type: 'category', name: cat.name },
        { image: cat.image },
        { upsert: true }
      );
    }

    // Add some regular suppliers
    const supplierNames = ['Nepal Med Distributor', 'Valley Pharma Wholesalers', 'Himalayan Health Suppliers'];
    const suppliers = [];
    for (const name of supplierNames) {
      let s = await Supplier.findOne({ name, pharmacyId: pharmacy._id });
      if (!s) {
        s = await Supplier.create({
          name,
          pharmacyId: pharmacy._id,
          contactPerson: 'Sandeep Dahal',
          phone: '9841234567',
          email: `${name.toLowerCase().replace(/ /g, '')}@example.com`,
          address: 'Kathmandu, Nepal'
        });
      }
      suppliers.push(s);
    }

    // Add Medicines
    for (const medData of medicines) {
      let med = await Medicine.findOne({ name: medData.name, pharmacyId: pharmacy._id });
      if (!med) {
        med = await Medicine.create({
          ...medData,
          pharmacyId: pharmacy._id,
          lowStockThreshold: 50
        });
        console.log(`Created medicine: ${med.name}`);

        // Add an initial batch for each new medicine
        const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 18); // 1.5 years from now

        await Batch.create({
          pharmacyId: pharmacy._id,
          medicineId: med._id,
          supplierId: randomSupplier._id,
          batchNumber: `NEP-${Math.floor(Math.random() * 9000) + 1000}`,
          expiryDate,
          purchasePrice: Math.floor(Math.random() * 100) + 50,
          sellingPrice: Math.floor(Math.random() * 50) + 150,
          initialQuantity: 100,
          quantity: 100,
          status: 'active'
        });
        console.log(`Added initial batch for ${med.name}`);
      }
    }

    console.log('Nepali seed data added successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedNepalData();
