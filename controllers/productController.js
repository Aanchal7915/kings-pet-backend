const Product = require('../models/Product');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            featured,
            bestSeller,
            subCategory,
            itemType,
        } = req.query;

        const query = {};

        if (search) {
            const safeSearch = escapeRegex(search.trim());
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } },
                { brand: { $regex: safeSearch, $options: 'i' } },
                { subCategory: { $regex: safeSearch, $options: 'i' } },
                { itemType: { $regex: safeSearch, $options: 'i' } },
                { categories: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        if (category && category !== 'All') {
            query.categories = category;
        }

        if (subCategory) {
            query.subCategory = { $regex: `^${escapeRegex(subCategory)}$`, $options: 'i' };
        }

        if (itemType) {
            query.itemType = { $regex: `^${escapeRegex(itemType)}$`, $options: 'i' };
        }

        if (featured === 'true') {
            query.featured = true;
        }

        if (bestSeller === 'true') {
            query.bestSeller = true;
        }

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create product (admin only)
exports.createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update product (admin only)
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Product deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
