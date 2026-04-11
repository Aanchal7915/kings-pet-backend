const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { 
    getCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    getSubCategories, 
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getServices, 
    createService,
    updateService,
    deleteService,
    getServiceById,
    getServiceBySlug
} = require('../controllers/catalogController');

router.get('/categories', getCategories);
router.post('/categories', protect, adminOnly, createCategory);
router.put('/categories/:id', protect, adminOnly, updateCategory);
router.delete('/categories/:id', protect, adminOnly, deleteCategory);
router.get('/subcategories', getSubCategories);
router.post('/subcategories', protect, adminOnly, createSubCategory);
router.put('/subcategories/:id', protect, adminOnly, updateSubCategory);
router.delete('/subcategories/:id', protect, adminOnly, deleteSubCategory);
router.get('/services', getServices);
router.post('/services', protect, adminOnly, createService);
router.put('/services/:id', protect, adminOnly, updateService);
router.delete('/services/:id', protect, adminOnly, deleteService);
router.get('/services/slug/:slug', getServiceBySlug);
router.get('/services/:id', getServiceById);

module.exports = router;
