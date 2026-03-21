const express = require('express');
const router = express.Router();
const Catalog = require('../models/Catalog');
const { authenticate, checkSubscription } = require('../middleware/auth');

router.use(authenticate, checkSubscription);

// GET /api/catalog — Get all catalog metadata for a pharmacy
router.get('/', async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { pharmacyId: req.user.pharmacyId };
    if (type) filter.type = type;

    const data = await Catalog.find(filter).sort({ name: 1 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/catalog — Create/Update catalog metadata
router.post('/', async (req, res, next) => {
  try {
    const { type, name, image, description } = req.body;
    const pharmacyId = req.user.pharmacyId;

    const item = await Catalog.findOneAndUpdate(
      { pharmacyId, type, name: name.trim() },
      { image, description },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/catalog/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Catalog.deleteOne({ _id: req.params.id, pharmacyId: req.user.pharmacyId });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
