const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const auth = require('../middleware/auth');

router.get('/stats', auth, staffController.getStaffStats);
router.get('/', auth, staffController.getStaff);
router.post('/', auth, staffController.createStaff);
router.put('/:id', auth, staffController.updateStaff);
router.delete('/:id', auth, staffController.deleteStaff);

module.exports = router;
