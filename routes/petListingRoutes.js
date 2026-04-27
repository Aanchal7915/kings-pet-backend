const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getPetListings,
  getPetListingById,
  createPetListing,
  updatePetListing,
  deletePetListing,
} = require('../controllers/petListingController');

router.get('/', getPetListings);
router.get('/:id', getPetListingById);
router.post('/', protect, adminOnly, createPetListing);
router.put('/:id', protect, adminOnly, updatePetListing);
router.delete('/:id', protect, adminOnly, deletePetListing);

module.exports = router;
