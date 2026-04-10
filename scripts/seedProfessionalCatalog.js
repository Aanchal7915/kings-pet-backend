const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Service = require('../models/Service');
const Product = require('../models/Product');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const categorySeeds = [
  {
    name: 'Preventive Care',
    description: 'Routine preventive healthcare for long-term pet wellness.',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 1,
  },
  {
    name: 'Clinical Treatment',
    description: 'Evidence-based diagnostics and medical management.',
    image: 'https://images.unsplash.com/photo-1583512603784-a8e3ea835f83?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 2,
  },
  {
    name: 'Surgery & Procedures',
    description: 'Specialized surgical and procedural care by trained vets.',
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 3,
  },
  {
    name: 'Grooming & Wellness',
    description: 'Hygiene, grooming, and supportive wellness services.',
    image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 4,
  },
];

const subCategorySeeds = [
  {
    categoryName: 'Preventive Care',
    name: 'Vaccination',
    description: 'Core and lifestyle vaccination schedules.',
    image: 'https://images.unsplash.com/photo-1612531386350-8ddf4f2f4ec5?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 1,
  },
  {
    categoryName: 'Preventive Care',
    name: 'Routine Checkup',
    description: 'General health checks and wellness consultation.',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 2,
  },
  {
    categoryName: 'Clinical Treatment',
    name: 'Dermatology',
    description: 'Skin and coat diagnostics with targeted treatment plans.',
    image: 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 1,
  },
  {
    categoryName: 'Clinical Treatment',
    name: 'Dental Care',
    description: 'Dental scaling and oral health procedures.',
    image: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 2,
  },
  {
    categoryName: 'Surgery & Procedures',
    name: 'Soft Tissue Surgery',
    description: 'Minor to major soft tissue procedures.',
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 1,
  },
  {
    categoryName: 'Surgery & Procedures',
    name: 'Orthopedic Surgery',
    description: 'Fracture and ligament repair procedures.',
    image: 'https://images.unsplash.com/photo-1601758123927-196f49db0f17?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 2,
  },
  {
    categoryName: 'Grooming & Wellness',
    name: 'Bath & Groom',
    description: 'Complete grooming and hygiene maintenance.',
    image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 1,
  },
  {
    categoryName: 'Grooming & Wellness',
    name: 'Nail & Ear Care',
    description: 'Nail trimming and ear hygiene package.',
    image: 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 2,
  },
];

const serviceSeeds = [
  {
    categoryName: 'Preventive Care',
    subCategoryName: 'Vaccination',
    name: 'Canine Core Vaccination Program',
    image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=1200&q=80',
    description: 'Structured vaccine protocol including DHPPi, anti-rabies, and annual boosters.',
    isFeatured: true,
    variants: [
      {
        variantName: 'Puppy Starter Pack',
        price: 1800,
        bookingAmount: 500,
        duration: 25,
        image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=900&q=80',
        description: 'Initial dose package for puppies aged 6-12 weeks.',
      },
      {
        variantName: 'Annual Booster Pack',
        price: 1400,
        bookingAmount: 400,
        duration: 20,
        image: 'https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=900&q=80',
        description: 'Yearly booster protocol for adult dogs.',
      },
    ],
  },
  {
    categoryName: 'Clinical Treatment',
    subCategoryName: 'Dermatology',
    name: 'Advanced Dermatology Consultation',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80',
    description: 'Skin scraping, fungal diagnostics, and customized dermatology treatment plan.',
    isFeatured: true,
    variants: [
      {
        variantName: 'Standard Skin Consultation',
        price: 1200,
        bookingAmount: 300,
        duration: 30,
        image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=80',
        description: 'Clinical exam with basic dermatology workup.',
      },
      {
        variantName: 'Comprehensive Allergy Panel',
        price: 3200,
        bookingAmount: 1000,
        duration: 45,
        image: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?auto=format&fit=crop&w=900&q=80',
        description: 'Extended panel for recurrent allergic skin disorders.',
      },
    ],
  },
  {
    categoryName: 'Surgery & Procedures',
    subCategoryName: 'Soft Tissue Surgery',
    name: 'Soft Tissue Surgical Care',
    image: 'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=1200&q=80',
    description: 'Pre-op, surgery, and post-op monitoring for soft tissue interventions.',
    isFeatured: false,
    variants: [
      {
        variantName: 'Minor Procedure Package',
        price: 4500,
        bookingAmount: 1500,
        duration: 60,
        image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=900&q=80',
        description: 'Includes pre-op assessment and day-care recovery.',
      },
      {
        variantName: 'Major Procedure Package',
        price: 12000,
        bookingAmount: 4000,
        duration: 120,
        image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=900&q=80',
        description: 'Complex surgeries with extended observation.',
      },
    ],
  },
  {
    categoryName: 'Grooming & Wellness',
    subCategoryName: 'Bath & Groom',
    name: 'Premium Grooming Session',
    image: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1200&q=80',
    description: 'Deep cleansing, coat conditioning, trimming, and hygiene check.',
    isFeatured: true,
    variants: [
      {
        variantName: 'Small Breed Grooming',
        price: 999,
        bookingAmount: 300,
        duration: 40,
        image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=900&q=80',
        description: 'Suitable for toy and small breeds up to 10 kg.',
      },
      {
        variantName: 'Large Breed Grooming',
        price: 1799,
        bookingAmount: 500,
        duration: 60,
        image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80',
        description: 'Full-service grooming for large breeds.',
      },
    ],
  },
];

const productSeeds = [
  {
    name: 'Royal Canin Gastrointestinal Dry Dog Food',
    brand: 'Royal Canin',
    categories: ['Clinical Nutrition'],
    subCategory: 'Prescription Diet',
    itemType: 'Dry Food',
    featured: true,
    bestSeller: true,
    description: 'Veterinary-recommended digestive support formula for dogs with sensitive gastrointestinal systems.',
    images: ['/product-images/royal-canin-gastro.svg'],
    pincodePricing: [
      {
        pincodes: ['121001', '121002', '121003'],
        packSize: '2 kg',
        originalPrice: 2100,
        discount: 10,
        finalPrice: 1890,
        stockQty: 35,
        verifiedLocations: ['Faridabad', 'Delhi NCR'],
      },
    ],
  },
  {
    name: 'Virbac Epi-Otic Advanced Ear Cleanser',
    brand: 'Virbac',
    categories: ['Pet Hygiene'],
    subCategory: 'Ear Care',
    itemType: 'Liquid Solution',
    featured: false,
    bestSeller: true,
    description: 'Clinical ear cleansing solution for routine maintenance and infection prevention in dogs and cats.',
    images: ['/product-images/virbac-epiotic.svg'],
    pincodePricing: [
      {
        pincodes: ['121001', '121004', '110001'],
        packSize: '125 ml',
        originalPrice: 780,
        discount: 8,
        finalPrice: 717,
        stockQty: 50,
        verifiedLocations: ['Faridabad', 'New Delhi'],
      },
    ],
  },
  {
    name: 'Beaphar Calcium Supplement Syrup',
    brand: 'Beaphar',
    categories: ['Supplements'],
    subCategory: 'Bone & Joint Health',
    itemType: 'Oral Syrup',
    featured: true,
    bestSeller: false,
    description: 'Daily calcium and mineral support for growing puppies and lactating pets.',
    images: ['/product-images/beaphar-calcium.svg'],
    pincodePricing: [
      {
        pincodes: ['121001', '121005', '122001'],
        packSize: '200 ml',
        originalPrice: 560,
        discount: 6,
        finalPrice: 526,
        stockQty: 42,
        verifiedLocations: ['Faridabad', 'Gurugram'],
      },
    ],
  },
  {
    name: 'MPS Medicated Anti-Tick Shampoo',
    brand: 'MPS',
    categories: ['Pet Hygiene'],
    subCategory: 'Coat Care',
    itemType: 'Shampoo',
    featured: false,
    bestSeller: true,
    description: 'Dermatologically balanced shampoo for tick and flea control with skin-friendly conditioning agents.',
    images: ['/product-images/mps-anti-tick.svg'],
    pincodePricing: [
      {
        pincodes: ['121001', '121002', '110024'],
        packSize: '300 ml',
        originalPrice: 450,
        discount: 5,
        finalPrice: 428,
        stockQty: 65,
        verifiedLocations: ['Faridabad', 'South Delhi'],
      },
    ],
  },
  {
    name: 'Pet Joint Care Omega Soft Chews',
    brand: 'CanineCare',
    categories: ['Supplements'],
    subCategory: 'Joint Support',
    itemType: 'Soft Chews',
    featured: true,
    bestSeller: false,
    description: 'High-potency glucosamine, chondroitin, and omega support formula for mobility management.',
    images: ['/product-images/joint-care-soft-chews.svg'],
    pincodePricing: [
      {
        pincodes: ['121001', '121003', '122002'],
        packSize: '90 chews',
        originalPrice: 1499,
        discount: 12,
        finalPrice: 1319,
        stockQty: 28,
        verifiedLocations: ['Faridabad', 'Gurugram'],
      },
    ],
  },
];

const upsertCategory = async (seed) => {
  const existing = await Category.findOne({ name: seed.name });
  if (existing) {
    await Category.updateOne({ _id: existing._id }, { $set: seed });
    return await Category.findById(existing._id);
  }
  return await Category.create(seed);
};

const upsertSubCategory = async (seed, categoryId) => {
  const query = { category: categoryId, name: seed.name };
  const payload = {
    category: categoryId,
    name: seed.name,
    description: seed.description,
    image: seed.image,
    isActive: true,
    sortOrder: seed.sortOrder || 0,
  };

  const existing = await SubCategory.findOne(query);
  if (existing) {
    await SubCategory.updateOne({ _id: existing._id }, { $set: payload });
    return await SubCategory.findById(existing._id);
  }
  return await SubCategory.create(payload);
};

const upsertService = async (seed, categoryId, subCategoryId) => {
  const query = { category: categoryId, subCategory: subCategoryId, name: seed.name };
  const payload = {
    category: categoryId,
    subCategory: subCategoryId,
    name: seed.name,
    image: seed.image,
    description: seed.description,
    isFeatured: Boolean(seed.isFeatured),
    isActive: true,
    variants: seed.variants.map((variant, idx) => ({
      ...variant,
      isActive: true,
      sortOrder: idx,
    })),
  };

  const existing = await Service.findOne(query);
  if (existing) {
    await Service.updateOne({ _id: existing._id }, { $set: payload });
    return await Service.findById(existing._id);
  }
  return await Service.create(payload);
};

const upsertProduct = async (seed) => {
  const existing = await Product.findOne({ name: seed.name });
  if (existing) {
    await Product.updateOne({ _id: existing._id }, { $set: seed });
    return await Product.findById(existing._id);
  }
  return await Product.create(seed);
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend .env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const categoryMap = new Map();
  for (const categorySeed of categorySeeds) {
    const category = await upsertCategory(categorySeed);
    categoryMap.set(categorySeed.name, category);
  }

  const subCategoryMap = new Map();
  for (const subCategorySeed of subCategorySeeds) {
    const parentCategory = categoryMap.get(subCategorySeed.categoryName);
    if (!parentCategory) continue;
    const subCategory = await upsertSubCategory(subCategorySeed, parentCategory._id);
    subCategoryMap.set(`${subCategorySeed.categoryName}::${subCategorySeed.name}`, subCategory);
  }

  for (const serviceSeed of serviceSeeds) {
    const category = categoryMap.get(serviceSeed.categoryName);
    const subCategory = subCategoryMap.get(`${serviceSeed.categoryName}::${serviceSeed.subCategoryName}`);
    if (!category || !subCategory) continue;
    await upsertService(serviceSeed, category._id, subCategory._id);
  }

  for (const productSeed of productSeeds) {
    await upsertProduct(productSeed);
  }

  console.log('Professional catalog seed completed successfully.');
  await mongoose.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Seed failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore disconnect error
    }
    process.exit(1);
  });
