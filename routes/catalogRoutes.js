const express = require('express');
const router = express.Router();
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
    getProducts 
} = require('../controllers/catalogController');

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/subcategories', getSubCategories);
router.post('/subcategories', createSubCategory);
router.put('/subcategories/:id', updateSubCategory);
router.delete('/subcategories/:id', deleteSubCategory);
router.get('/services', getServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);
router.get('/services/:id', getServiceById);
router.get('/products', getProducts);

module.exports = router;
