const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const auth = require('../middleware/auth');

router.get('/', auth, enquiryController.getEnquiries);
router.get('/:id', auth, enquiryController.getEnquiryById);
router.post('/', auth, enquiryController.createEnquiry);
router.put('/:id', auth, enquiryController.updateEnquiry);
router.post('/:id/convert', auth, enquiryController.convertEnquiryToReservation);
router.post('/:id/send-email', auth, enquiryController.sendEnquiryEmail);
router.patch('/:id/status', auth, enquiryController.updateStatus);
router.delete('/:id', auth, enquiryController.deleteEnquiry);

module.exports = router;
