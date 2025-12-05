const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middlewares");

const {
  createSchedule,
  listSchedules,
  updateSchedule,
  createScheduleForField,
  updateScheduleForField,
  getListScheduleForField,
} = require("../controllers/schedule.controller");

router.post("/schedule/create", verifyToken, createSchedule);
router.get("/schedule/list", listSchedules);
router.put("/schedule/update/:id", verifyToken, updateSchedule);

router.get("/schedule_type/list", verifyToken, getListScheduleForField);
router.put("/schedule_type/update/:id", verifyToken, updateScheduleForField);
router.post("/schedule_type/create", verifyToken, createScheduleForField);

module.exports = router;
