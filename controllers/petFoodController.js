const PetFood = require('../models/PetFood');

exports.getPetFoods = async (req, res) => {
  try {
    const { petType, foodType, includeInactive } = req.query;
    const query = {};
    if (!includeInactive) query.isActive = true;
    if (petType) query.petType = petType;
    if (foodType) query.foodType = foodType;

    const foods = await PetFood.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: foods });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPetFoodById = async (req, res) => {
  try {
    const food = await PetFood.findById(req.params.id);
    if (!food) return res.status(404).json({ success: false, error: 'Pet food not found' });
    return res.status(200).json({ success: true, data: food });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createPetFood = async (req, res) => {
  try {
    const food = await PetFood.create(req.body);
    return res.status(201).json({ success: true, data: food });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.updatePetFood = async (req, res) => {
  try {
    const food = await PetFood.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!food) return res.status(404).json({ success: false, error: 'Pet food not found' });
    return res.status(200).json({ success: true, data: food });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.deletePetFood = async (req, res) => {
  try {
    const food = await PetFood.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ success: false, error: 'Pet food not found' });
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
