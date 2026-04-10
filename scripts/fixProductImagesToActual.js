const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Product = require('../models/Product');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const imageMap = {
  'Royal Canin Gastrointestinal Dry Dog Food': ['/product-images/royal-canin-gastro.svg'],
  'Virbac Epi-Otic Advanced Ear Cleanser': ['/product-images/virbac-epiotic.svg'],
  'Beaphar Calcium Supplement Syrup': ['/product-images/beaphar-calcium.svg'],
  'MPS Medicated Anti-Tick Shampoo': ['/product-images/mps-anti-tick.svg'],
  'Pet Joint Care Omega Soft Chews': ['/product-images/joint-care-soft-chews.svg'],
};

async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing in .env');
  await mongoose.connect(process.env.MONGO_URI);

  let updated = 0;
  for (const [name, images] of Object.entries(imageMap)) {
    const result = await Product.updateOne({ name }, { $set: { images } });
    if (result.modifiedCount > 0) updated += 1;
  }

  console.log(`Updated ${updated} product image records.`);
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(error.message);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  });
