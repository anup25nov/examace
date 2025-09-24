// Test script to verify Razorpay signature generation
// Run with: node test_signature_verification.js

const crypto = require('crypto');

// Test data from your payload
const orderId = 'order_RLWjBNgO37P0ZK';
const paymentId = 'pay_RLWjUeE5ER50I5';
const receivedSignature = '2de6c62bd2fb89cc9ab27ce498786cc3d9c70661aa253ba782d9b21eea81a190';

// Replace with your actual Razorpay Key Secret
const razorpayKeySecret = 'YOUR_RAZORPAY_KEY_SECRET_HERE';

function generateSignature(orderId, paymentId, keySecret) {
  const data = `${orderId}|${paymentId}`;
  const signature = crypto
    .createHmac('sha256', keySecret)
    .update(data)
    .digest('hex');
  return signature;
}

console.log('=== Razorpay Signature Verification Test ===');
console.log('Order ID:', orderId);
console.log('Payment ID:', paymentId);
console.log('Received Signature:', receivedSignature);
console.log('');

if (razorpayKeySecret === 'YOUR_RAZORPAY_KEY_SECRET_HERE') {
  console.log('⚠️  Please replace YOUR_RAZORPAY_KEY_SECRET_HERE with your actual Razorpay Key Secret');
  console.log('');
  console.log('To find your Key Secret:');
  console.log('1. Go to Razorpay Dashboard');
  console.log('2. Navigate to Settings > API Keys');
  console.log('3. Copy the Key Secret');
  console.log('');
  console.log('Then run: node test_signature_verification.js');
} else {
  const expectedSignature = generateSignature(orderId, paymentId, razorpayKeySecret);
  console.log('Generated Signature:', expectedSignature);
  console.log('Received Signature:', receivedSignature);
  console.log('Signatures Match:', expectedSignature === receivedSignature);
  
  if (expectedSignature === receivedSignature) {
    console.log('✅ Signature verification successful!');
  } else {
    console.log('❌ Signature verification failed!');
    console.log('');
    console.log('Possible issues:');
    console.log('1. Wrong Key Secret - Make sure you\'re using the correct Key Secret from Razorpay Dashboard');
    console.log('2. Environment variable not set - Check if RAZORPAY_KEY_SECRET is correctly set in Supabase');
    console.log('3. Key Secret format - Make sure there are no extra spaces or characters');
  }
}
