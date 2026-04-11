const Setting = require('../models/Setting');

exports.getAdvanceAmount = async (_req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'advancePaymentAmount' });
    const amount = Number(setting?.value || 0);
    res.status(200).json({ success: true, data: { key: 'advancePaymentAmount', value: amount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateAdvanceAmount = async (req, res) => {
  try {
    const amount = Number(req.body?.value);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ success: false, error: 'Advance payment amount must be a non-negative number' });
    }

    const setting = await Setting.findOneAndUpdate(
      { key: 'advancePaymentAmount' },
      { $set: { value: amount } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, data: setting });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
