const express = require('express');
const router = express.Router();
const {
    getSubCategories,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
} = require('../controllers/catalogController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getSubCategories);
router.post('/', protect, adminOnly, createSubCategory);
router.put('/:id', protect, adminOnly, updateSubCategory);
router.delete('/:id', protect, adminOnly, deleteSubCategory);

module.exports = router;