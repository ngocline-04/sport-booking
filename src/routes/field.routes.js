const express = require('express');
const router = express.Router();

const { createField } = require('../controllers/field.controller');

// POST: Create new field
router.post('/create', createField);

module.exports = router;
