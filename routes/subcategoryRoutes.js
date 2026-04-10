const express = require('express');
const router = express.Router();
const {
    getSubCategories,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
} = require('../controllers/catalogController');
const { protect } = require('../middleware/auth');

router.get('/', getSubCategories);
router.post('/', protect, createSubCategory);
router.put('/:id', protect, updateSubCategory);
router.delete('/:id', protect, deleteSubCategory);

module.exports = router;