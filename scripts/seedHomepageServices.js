const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Service = require('../models/Service');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seeds = [
  {
    categoryName: 'Preventive Care',
    categoryDescription: 'Routine preventive healthcare for long-term pet wellness.',
    subCategoryName: 'Vaccination',
    subCategoryDescription: 'Core and lifestyle vaccination schedules.',
    service: {
      name: 'Vaccination',
      description:
        'Protect your furry friend with our comprehensive vaccination packages. We offer core and lifestyle vaccines administered by experienced veterinarians.',
      image:
        'https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=1200&q=80',
      isFeatured: true,
      variants: [
        {
          variantName: 'Core vaccines available',
          price: 500,
          bookingAmount: 150,
          duration: 20,
          image:
            'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=80',
          description: 'DHPPi and anti-rabies protocol based on pet age.',
        },
        {
          variantName: 'Pet vaccination record',
          price: 650,
          bookingAmount: 200,
          duration: 25,
          image:
            'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80',
          description: 'Includes vaccination card and schedule counseling.',
        },
      ],
    },
  },
  {
    categoryName: 'Surgery & Procedures',
    categoryDescription: 'Specialized surgical and procedural care by trained vets.',
    subCategoryName: 'Major Surgery',
    subCategoryDescription: 'Comprehensive major surgical interventions.',
    service: {
      name: 'Major Surgery',
      description:
        'Comprehensive surgical care for complex and critical conditions with advanced anesthesia and monitoring.',
      image:
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      isFeatured: true,
      variants: [
        {
          variantName: 'Pre-operative evaluation',
          price: 6000,
          bookingAmount: 2000,
          duration: 45,
          image:
            'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80',
          description: 'Bloodwork, imaging, and risk assessment.',
        },
        {
          variantName: 'Advanced anesthesia',
          price: 12000,
          bookingAmount: 4000,
          duration: 120,
          image:
            'https://images.unsplash.com/photo-1516549655669-df6e5e3b6482?auto=format&fit=crop&w=900&q=80',
          description: 'Full anesthesia and intra-op monitoring support.',
        },
      ],
    },
  },
  {
    categoryName: 'Surgery & Procedures',
    categoryDescription: 'Specialized surgical and procedural care by trained vets.',
    subCategoryName: 'Soft Tissue Surgery',
    subCategoryDescription: 'Minor to major soft tissue procedures.',
    service: {
      name: 'Soft Tissue Surgery',
      description:
        'Procedures involving skin, muscles, and internal organs including spay/neuter, mass removal, and more.',
      image:
        'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=80',
      isFeatured: true,
      variants: [
        {
          variantName: 'Spay/Neuter',
          price: 5000,
          bookingAmount: 1500,
          duration: 75,
          image:
            'https://images.unsplash.com/photo-1551887373-6bca6f7f8b12?auto=format&fit=crop&w=900&q=80',
          description: 'Routine sterilization procedure with post-op support.',
        },
        {
          variantName: 'Wound reconstruction',
          price: 8000,
          bookingAmount: 2500,
          duration: 90,
          image:
            'https://images.unsplash.com/photo-1511174511562-5f97f4f4a24e?auto=format&fit=crop&w=900&q=80',
          description: 'Complex repair and closure for traumatic wounds.',
        },
      ],
    },
  },
];

const upsertCategory = async (name, description) => {
  const existing = await Category.findOne({ name });
  if (existing) {
    existing.description = description || existing.description;
    existing.isActive = true;
    await existing.save();
    return existing;
  }

  return Category.create({
    name,
    description,
    isActive: true,
  });
};

const upsertSubCategory = async (categoryId, name, description) => {
  const existing = await SubCategory.findOne({ category: categoryId, name });
  if (existing) {
    existing.description = description || existing.description;
    existing.isActive = true;
    await existing.save();
    return existing;
  }

  return SubCategory.create({
    category: categoryId,
    name,
    description,
    isActive: true,
  });
};

const buildVariants = (variants = []) =>
  variants.map((variant, index) => ({
    ...variant,
    isActive: true,
    sortOrder: index,
  }));

const upsertService = async (categoryId, subCategoryId, seedService) => {
  const existing = await Service.findOne({
    category: categoryId,
    subCategory: subCategoryId,
    name: seedService.name,
  });

  const payload = {
    category: categoryId,
    subCategory: subCategoryId,
    name: seedService.name,
    description: seedService.description,
    image: seedService.image,
    isFeatured: Boolean(seedService.isFeatured),
    isActive: true,
    variants: buildVariants(seedService.variants),
  };

  if (existing) {
    await Service.updateOne({ _id: existing._id }, { $set: payload });
    return 'updated';
  }

  await Service.create(payload);
  return 'created';
};

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in backend .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const summary = [];

    for (const item of seeds) {
      const category = await upsertCategory(item.categoryName, item.categoryDescription);
      const subCategory = await upsertSubCategory(category._id, item.subCategoryName, item.subCategoryDescription);
      const status = await upsertService(category._id, subCategory._id, item.service);
      summary.push(`${item.service.name}: ${status}`);
    }

    console.log('Homepage service seed complete');
    summary.forEach((line) => console.log(`- ${line}`));
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
