const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getPetFoods,
  getPetFoodById,
  createPetFood,
  updatePetFood,
  deletePetFood,
} = require('../controllers/petFoodController');

router.get('/', getPetFoods);
router.get('/:id', getPetFoodById);
router.post('/', protect, adminOnly, createPetFood);
router.put('/:id', protect, adminOnly, updatePetFood);
router.delete('/:id', protect, adminOnly, deletePetFood);

module.exports = router;
