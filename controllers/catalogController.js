const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Service = require('../models/Service');
const Product = require('../models/Product');

const buildActiveQuery = (query = {}) => {
    const filter = {};
    if (query.includeInactive !== 'true') {
        filter.isActive = true;
    }
    return filter;
};

const toBoolean = (value) => value === true || value === 'true';

const normalizeText = (value) => String(value || '').trim();

const normalizeVariants = (variants = []) => {
    if (!Array.isArray(variants) || variants.length === 0) {
        return [];
    }

    return variants.map((variant, index) => ({
        variantName: normalizeText(variant.variantName),
        image: normalizeText(variant.image),
        price: Number(variant.price || 0),
        bookingAmount: Number(variant.bookingAmount || 0),
        duration: Number(variant.duration || 30),
        description: normalizeText(variant.description),
        isActive: variant.isActive !== false,
        sortOrder: Number.isFinite(Number(variant.sortOrder)) ? Number(variant.sortOrder) : index,
    }));
};

const verifyCategoryExists = async (categoryId) => {
    const category = await Category.findById(categoryId);
    if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }
    return category;
};

const verifySubCategoryExists = async (subCategoryId) => {
    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
        const error = new Error('Subcategory not found');
        error.statusCode = 404;
        throw error;
    }
    return subCategory;
};

const sendError = (res, error, fallbackMessage = 'Server Error') => {
    const statusCode = error.statusCode || error.status || 500;
    return res.status(statusCode).json({
        success: false,
        error: error.message || fallbackMessage,
    });
};

const isDuplicateKeyError = (error) => error?.code === 11000;

const buildCategoryPayload = (body) => ({
    name: normalizeText(body.name),
    description: normalizeText(body.description),
    image: normalizeText(body.image),
    isActive: body.isActive !== false,
    sortOrder: Number(body.sortOrder || 0),
});

const buildSubCategoryPayload = (body) => ({
    category: body.category,
    name: normalizeText(body.name),
    description: normalizeText(body.description),
    image: normalizeText(body.image),
    isActive: body.isActive !== false,
    sortOrder: Number(body.sortOrder || 0),
});

const buildServicePayload = (body) => ({
    category: body.category,
    subCategory: body.subCategory,
    name: normalizeText(body.name),
    image: normalizeText(body.image),
    description: normalizeText(body.description),
    isFeatured: toBoolean(body.isFeatured),
    isActive: body.isActive !== false,
    variants: normalizeVariants(body.variants),
});

const validateServicePayload = async (payload) => {
    if (!payload.category || !payload.subCategory || !payload.name) {
        const error = new Error('Category, subcategory and service name are required');
        error.statusCode = 400;
        throw error;
    }

    const subCategory = await verifySubCategoryExists(payload.subCategory);
    await verifyCategoryExists(payload.category);

    if (String(subCategory.category) !== String(payload.category)) {
        const error = new Error('Selected subcategory does not belong to the selected category');
        error.statusCode = 400;
        throw error;
    }

    if (!Array.isArray(payload.variants) || payload.variants.length === 0) {
        const error = new Error('At least one variant is required');
        error.statusCode = 400;
        throw error;
    }

    const invalidVariant = payload.variants.find((variant) => !variant.variantName || Number.isNaN(Number(variant.price)));
    if (invalidVariant) {
        const error = new Error('Each variant must include a name and valid price');
        error.statusCode = 400;
        throw error;
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const query = buildActiveQuery(req.query);
        const categories = await Category.find(query).sort({ sortOrder: 1, createdAt: -1 });
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.createCategory = async (req, res) => {
    try {
        const payload = buildCategoryPayload(req.body);
        if (!payload.name) {
            return res.status(400).json({ success: false, error: 'Category name is required' });
        }

        const category = await Category.create(payload);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return res.status(409).json({ success: false, error: 'Category name already exists' });
        }
        sendError(res, error);
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const payload = buildCategoryPayload(req.body);
        const category = await Category.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true,
        });

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return res.status(409).json({ success: false, error: 'Category name already exists' });
        }
        sendError(res, error);
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const [subCategoryCount, serviceCount] = await Promise.all([
            SubCategory.countDocuments({ category: req.params.id }),
            Service.countDocuments({ category: req.params.id }),
        ]);

        if (subCategoryCount > 0 || serviceCount > 0) {
            return res.status(409).json({
                success: false,
                error: 'Cannot delete category with linked subcategories or services',
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        res.status(200).json({ success: true, message: 'Category deleted' });
    } catch (error) {
        sendError(res, error);
    }
};

// Get subcategories by category
exports.getSubCategories = async (req, res) => {
    try {
        const { category } = req.query;
        const query = buildActiveQuery(req.query);
        if (category) query.category = category;

        const subCategories = await SubCategory.find(query)
            .populate('category', 'name slug image isActive')
            .sort({ sortOrder: 1, createdAt: -1 });
        res.status(200).json({
            success: true,
            data: subCategories
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.createSubCategory = async (req, res) => {
    try {
        const payload = buildSubCategoryPayload(req.body);
        if (!payload.category || !payload.name) {
            return res.status(400).json({ success: false, error: 'Category and subcategory name are required' });
        }

        await verifyCategoryExists(payload.category);
        const subCategory = await SubCategory.create(payload);
        res.status(201).json({ success: true, data: subCategory });
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return res.status(409).json({ success: false, error: 'Subcategory already exists for this category' });
        }
        sendError(res, error);
    }
};

exports.updateSubCategory = async (req, res) => {
    try {
        const payload = buildSubCategoryPayload(req.body);
        if (payload.category) {
            await verifyCategoryExists(payload.category);
        }

        const subCategory = await SubCategory.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true,
        });

        if (!subCategory) {
            return res.status(404).json({ success: false, error: 'Subcategory not found' });
        }

        res.status(200).json({ success: true, data: subCategory });
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return res.status(409).json({ success: false, error: 'Subcategory already exists for this category' });
        }
        sendError(res, error);
    }
};

exports.deleteSubCategory = async (req, res) => {
    try {
        const serviceCount = await Service.countDocuments({ subCategory: req.params.id });
        if (serviceCount > 0) {
            return res.status(409).json({
                success: false,
                error: 'Cannot delete subcategory with linked services',
            });
        }

        const subCategory = await SubCategory.findByIdAndDelete(req.params.id);
        if (!subCategory) {
            return res.status(404).json({ success: false, error: 'Subcategory not found' });
        }

        res.status(200).json({ success: true, message: 'Subcategory deleted' });
    } catch (error) {
        sendError(res, error);
    }
};

// Get services by category and subcategory
exports.getServices = async (req, res) => {
    try {
        const { category, subCategory, featured } = req.query;
        const query = buildActiveQuery(req.query);
        if (category) query.category = category;
        if (subCategory) query.subCategory = subCategory;
        if (featured === 'true') query.isFeatured = true;

        const services = await Service.find(query)
            .populate('category', 'name slug image isActive')
            .populate('subCategory', 'name slug image isActive')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: services
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.createService = async (req, res) => {
    try {
        const payload = buildServicePayload(req.body);
        await validateServicePayload(payload);

        const service = await Service.create(payload);
        const populated = await Service.findById(service._id)
            .populate('category', 'name slug image isActive')
            .populate('subCategory', 'name slug image isActive');

        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return res.status(409).json({ success: false, error: 'Service name already exists' });
        }
        sendError(res, error);
    }
};

exports.updateService = async (req, res) => {
    try {
        const payload = buildServicePayload(req.body);
        await validateServicePayload(payload);

        const service = await Service.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true,
        })
            .populate('category', 'name slug image isActive')
            .populate('subCategory', 'name slug image isActive');

        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        res.status(200).json({ success: true, data: service });
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return res.status(409).json({ success: false, error: 'Service name already exists' });
        }
        sendError(res, error);
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        res.status(200).json({ success: true, message: 'Service deleted' });
    } catch (error) {
        sendError(res, error);
    }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate('category', 'name slug image isActive')
            .populate('subCategory', 'name slug image isActive');
        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }
        res.status(200).json({
            success: true,
            data: service
        });
    } catch (error) {
        sendError(res, error);
    }
};

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
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

// Aliases for exact REST paths
exports.getAllCategories = exports.getCategories;
exports.createCategoryItem = exports.createCategory;
exports.updateCategoryItem = exports.updateCategory;
exports.deleteCategoryItem = exports.deleteCategory;
exports.getAllSubCategories = exports.getSubCategories;
exports.createSubCategoryItem = exports.createSubCategory;
exports.updateSubCategoryItem = exports.updateSubCategory;
exports.deleteSubCategoryItem = exports.deleteSubCategory;
exports.getAllServices = exports.getServices;
exports.createServiceItem = exports.createService;
exports.updateServiceItem = exports.updateService;
exports.deleteServiceItem = exports.deleteService;
