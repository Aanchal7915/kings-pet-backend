const PetListing = require('../models/PetListing');

exports.getPetListings = async (req, res) => {
  try {
    const { petType, includeInactive, includeSold } = req.query;
    const query = {};
    if (!includeInactive) query.isActive = true;
    if (!includeSold) query.isAvailable = true;
    if (petType) query.petType = petType;

    const listings = await PetListing.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: listings });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPetListingById = async (req, res) => {
  try {
    const listing = await PetListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, error: 'Pet listing not found' });
    return res.status(200).json({ success: true, data: listing });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createPetListing = async (req, res) => {
  try {
    const listing = await PetListing.create(req.body);
    return res.status(201).json({ success: true, data: listing });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.updatePetListing = async (req, res) => {
  try {
    const listing = await PetListing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!listing) return res.status(404).json({ success: false, error: 'Pet listing not found' });
    return res.status(200).json({ success: true, data: listing });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.deletePetListing = async (req, res) => {
  try {
    const listing = await PetListing.findByIdAndDelete(req.params.id);
    if (!listing) return res.status(404).json({ success: false, error: 'Pet listing not found' });
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
