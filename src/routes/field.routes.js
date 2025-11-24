const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middlewares');

const { createField, getListFields, updateField, deleteField, getFieldById } = require('../controllers/field.controller');

router.post('/create', verifyToken, createField);
router.get("/list_fields", getListFields);
router.put("/update_field/:id", verifyToken, updateField);
router.delete("/delete_field/:id", verifyToken, deleteField);
router.get("/detail_field/:id", getFieldById);

module.exports = router;
