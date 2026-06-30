const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

router.get('/stats', auth, customerController.getCustomerStats);
router.get('/phone/:phone', auth, customerController.getCustomerByPhone);
router.get('/', auth, customerController.getCustomers);
router.post('/', auth, customerController.createCustomer);
router.put('/:id', auth, customerController.updateCustomer);
router.delete('/:id', auth, customerController.deleteCustomer);

module.exports = router;
