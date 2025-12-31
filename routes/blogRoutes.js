const express = require('express');
const router = express.Router();
const { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getBlogs);
router.post('/', protect, createBlog);

router.get('/:id', getBlogById);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

module.exports = router;
