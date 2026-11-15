const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const auth = require('../middleware/auth');

router.get('/', auth, reservationController.getReservations);
router.get('/:id', auth, reservationController.getReservationById);
router.post('/', auth, reservationController.createReservation);
router.put('/:id', auth, reservationController.updateReservation);
router.patch('/:id/status', auth, reservationController.updateStatus);
router.post('/:id/send-invoice', auth, reservationController.sendManualInvoice);
router.post('/:id/send-receipt', auth, reservationController.sendManualReceipt);
router.delete('/:id', auth, reservationController.deleteReservation);

module.exports = router;
