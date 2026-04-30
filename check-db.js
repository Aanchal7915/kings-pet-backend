const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const SubCategory = require('./models/SubCategory');
const Service = require('./models/Service');
const PetFood = require('./models/PetFood');
const PetListing = require('./models/PetListing');

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const catCount = await Category.countDocuments();
        const subCount = await SubCategory.countDocuments();
        const serCount = await Service.countDocuments();
        const foodCount = await PetFood.countDocuments();
        const petCount = await PetListing.countDocuments();

        console.log('--- DB Counts ---');
        console.log('Categories:', catCount);
        console.log('Subcategories:', subCount);
        console.log('Services:', serCount);
        console.log('Pet Foods:', foodCount);
        console.log('Pet Listings:', petCount);
        
        if (serCount > 0) {
            const sample = await Service.findOne();
            console.log('Sample Service:', JSON.stringify(sample, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
