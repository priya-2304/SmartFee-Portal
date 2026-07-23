const Razorpay = require('razorpay');
const crypto = require('crypto');

let instance;

const getRazorpayInstance = () => {
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
};

/**
 * Creates a Razorpay order for the given amount (in INR rupees; converted to paise internally).
 */
const createOrder = async (amount, receipt) => {
  const razorpay = getRazorpayInstance();
  return razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    receipt,
    payment_capture: 1,
  });
};

/**
 * Verifies the Razorpay payment signature returned by checkout.js after a successful payment.
 */
const verifySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  return generatedSignature === razorpay_signature;
};

module.exports = { getRazorpayInstance, createOrder, verifySignature };
