const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middlewares");

const {
  createField,
  getListFields,
  updateField,
  deleteField,
  getFieldById,
  listTypesSports,
  updateFieldType,
  createTypeSport,
  updateSportType,
  deleteSportType,
  listAvailableFields
} = require("../controllers/field.controller");
// const { listAvailableFields } = require("../controllers/location.controller");

router.post("/create-field", verifyToken, createField);
router.get("/list_fields", getListFields);
router.put("/update_field/:id", verifyToken, updateField);
router.get("/list_available", listAvailableFields);

router.delete("/delete_field/:id", verifyToken, deleteField);
router.get("/detail_field/:id", getFieldById);
router.get("/field-type", getListFields);

router.delete("/delete/type_field/:id", verifyToken, deleteField);
router.put("/update/type_field/:id", verifyToken, updateFieldType);
router.post("/create/type_field", verifyToken, createField);

router.get("/list/sport_type", listTypesSports);
router.post("/create/sport_type", verifyToken, createTypeSport);
router.put("/update/sport_type/:id", verifyToken, updateSportType);
router.delete("/delete/sport_type/:id", verifyToken, deleteSportType);

module.exports = router;
