const express = require("express");
const { getClaims } = require("../controllers/claimController");

const router = express.Router();

router.get("/", getClaims);

module.exports = router;