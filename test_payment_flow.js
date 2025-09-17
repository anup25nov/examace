// Test script for payment flow with referral
// This will help us test the complete flow

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your actual URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual key

// Test data
const testData = {
  // Referrer user
  referrer: {
    id: 'test-referrer-123',
    phone: '+919876543210'
  },
  // Referred user
  referred: {
    id: 'test-referred-456',
    phone: '+919876543211'
  },
  // Payment data
  payment: {
    user_id: 'test-referred-456',
    plan: 'pro',
    amount: 1.00,
    currency: 'INR',
    razorpay_payment_id: 'test_razorpay_payment_123',
    razorpay_order_id: 'test_razorpay_order_456',
    razorpay_signature: 'test_signature_789'
  }
};

async function testPaymentFlow() {
  console.log('🚀 Starting payment flow test...');
  
  try {
    // Step 1: Create test users
    console.log('📝 Step 1: Creating test users...');
    
    // Create referrer
    const referrerResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        id: testData.referrer.id,
        phone: testData.referrer.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    
    // Create referred user
    const referredResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        id: testData.referred.id,
        phone: testData.referred.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    
    console.log('✅ Test users created');
    
    // Step 2: Create referral code
    console.log('🔗 Step 2: Creating referral code...');
    
    const referralCodeResponse = await fetch(`${SUPABASE_URL}/rest/v1/referral_codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        user_id: testData.referrer.id,
        code: 'TEST123',
        total_referrals: 0,
        total_earnings: 0.00,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    
    console.log('✅ Referral code created');
    
    // Step 3: Create referral transaction
    console.log('📋 Step 3: Creating referral transaction...');
    
    const referralTxnResponse = await fetch(`${SUPABASE_URL}/rest/v1/referral_transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        id: 'test-referral-txn-789',
        referrer_id: testData.referrer.id,
        referred_id: testData.referred.id,
        referral_code: 'TEST123',
        amount: 0.00,
        transaction_type: 'referral_signup',
        status: 'pending',
        commission_amount: 0.00,
        commission_status: 'pending',
        membership_purchased: false,
        first_membership_only: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    
    console.log('✅ Referral transaction created');
    
    // Step 4: Simulate payment verification
    console.log('💳 Step 4: Simulating payment verification...');
    
    const paymentVerificationResponse = await fetch(`${SUPABASE_URL}/functions/v1/verify_razorpay_payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(testData.payment)
    });
    
    const paymentResult = await paymentVerificationResponse.json();
    console.log('💳 Payment verification result:', paymentResult);
    
    // Step 5: Check results
    console.log('🔍 Step 5: Checking results...');
    
    // Check referral transaction
    const referralTxnCheck = await fetch(`${SUPABASE_URL}/rest/v1/referral_transactions?id=eq.test-referral-txn-789`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    const referralTxnData = await referralTxnCheck.json();
    console.log('📋 Referral transaction after payment:', referralTxnData);
    
    // Check commission
    const commissionCheck = await fetch(`${SUPABASE_URL}/rest/v1/referral_commissions?referred_id=eq.test-referred-456`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    const commissionData = await commissionCheck.json();
    console.log('💰 Commission data:', commissionData);
    
    // Check referrer earnings
    const referrerEarningsCheck = await fetch(`${SUPABASE_URL}/rest/v1/referral_codes?user_id=eq.test-referrer-123`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    const referrerEarningsData = await referrerEarningsCheck.json();
    console.log('💎 Referrer earnings:', referrerEarningsData);
    
    // Step 6: Test referral stats API
    console.log('📊 Step 6: Testing referral stats API...');
    
    const statsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_comprehensive_referral_stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        user_uuid: testData.referrer.id
      })
    });
    const statsData = await statsResponse.json();
    console.log('📊 Referral stats:', statsData);
    
    console.log('🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPaymentFlow();
