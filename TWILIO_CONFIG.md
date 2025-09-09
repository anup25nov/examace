# Twilio Configuration

## Environment Variables
Add these to your `.env.local` file:

```env
# Twilio SMS Configuration
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

## Setup Instructions
1. Create a `.env.local` file in your project root
2. Add your Twilio credentials to the file
3. Never commit the `.env.local` file to version control
4. The app will show a warning if credentials are not found

## Security Note
- All credentials are stored in environment variables only
- No hardcoded credentials in the codebase
- `.env.local` is ignored by Git for security

## Status
✅ Twilio SDK installed  
✅ SMS service configured  
✅ Profile service updated  
✅ Ready for testing  

## Next Steps
1. Add the environment variables to your `.env.local` file
2. Run the database migration script
3. Test the OTP functionality
