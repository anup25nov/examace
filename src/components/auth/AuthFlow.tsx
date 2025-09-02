import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, ArrowLeft, Lock, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendOTPCode, verifyOTPCode, setUserPIN, verifyUserPIN, checkUserStatus } from "@/lib/firebaseAuth";

type AuthStep = 'phone' | 'otp' | 'pin-setup' | 'pin-login';

interface AuthFlowProps {
  onSuccess: () => void;
  onBack: () => void;
}

const AuthFlow = ({ onSuccess, onBack }: AuthFlowProps) => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const { toast } = useToast();

  const handlePhoneSubmit = async () => {
    if (phoneNumber.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Checking user status for phone:', phoneNumber);
      
      // Check if user exists and has PIN
      const userStatus = await checkUserStatus(phoneNumber);
      console.log('User status result:', userStatus);
      
      setUserExists(userStatus.exists);
      setHasPin(userStatus.hasPin);

      if (userStatus.exists && userStatus.hasPin) {
        // User exists with PIN, go to PIN login
        console.log('User exists with PIN, going to PIN login');
        setStep('pin-login');
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // Continue with OTP flow even if user check fails
    }

    // Send OTP for new user or existing user without PIN
    console.log('Sending OTP to phone:', phoneNumber);
    const result = await sendOTPCode(phoneNumber);
    console.log('OTP send result:', result);
    
    setIsLoading(false);

    if (result.success) {
      const toastTitle = result.isDevelopment ? "Development Mode OTP" : "OTP Sent";
      const toastDescription = result.isDevelopment 
        ? `Development mode: Use OTP ${result.mockOTP} to continue`
        : "Please check your phone for the verification code.";
      
      toast({
        title: toastTitle,
        description: toastDescription,
      });
      setStep('otp');
    } else {
      console.error('OTP send failed:', result.error);
      toast({
        title: "Failed to Send OTP",
        description: result.error || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOTPVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await verifyOTPCode(otp);
    setIsLoading(false);

    if (result.success) {
      if (userExists && !hasPin) {
        // Existing user without PIN
        setStep('pin-setup');
      } else if (!userExists) {
        // New user
        setStep('pin-setup');
      } else {
        // This shouldn't happen, but handle it
        onSuccess();
      }
    } else {
      toast({
        title: "Invalid OTP",
        description: result.error || "Please check your OTP and try again.",
        variant: "destructive",
      });
    }
  };

  const handlePINSetup = async () => {
    if (pin.length !== 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 6-digit PIN.",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PINs Don't Match",
        description: "Please make sure both PINs are identical.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await setUserPIN(pin);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "PIN Set Successfully",
        description: "You can now use your PIN to login quickly.",
      });
      onSuccess();
    } else {
      toast({
        title: "Failed to Set PIN",
        description: result.error || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePINLogin = async () => {
    if (pin.length !== 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter your 6-digit PIN.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await verifyUserPIN(phoneNumber, pin);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Welcome Back!",
        description: "You're now logged in.",
      });
      onSuccess();
    } else {
      toast({
        title: "Invalid PIN",
        description: "Please check your PIN and try again.",
        variant: "destructive",
      });
    }
  };

  const handleForgotPIN = async () => {
    setIsLoading(true);
    const result = await sendOTPCode(phoneNumber);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "OTP Sent",
        description: "Please verify your phone to reset your PIN.",
      });
      setStep('otp');
      setHasPin(false); // This will make it go to PIN setup after OTP verification
    } else {
      toast({
        title: "Failed to Send OTP",
        description: result.error || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'phone':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Enter Phone Number</h2>
              <p className="text-muted-foreground">We'll send you an OTP to verify your identity</p>
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">+91</span>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  className="pl-12"
                />
              </div>
            </div>
            
            <Button 
              onClick={handlePhoneSubmit}
              disabled={phoneNumber.length !== 10 || isLoading}
              className="w-full"
            >
              {isLoading ? "Checking..." : "Send OTP"}
            </Button>
          </div>
        );

      case 'otp':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Verify OTP</h2>
              <p className="text-muted-foreground">Enter the 6-digit code sent to +91 {phoneNumber}</p>
            </div>
            
            <div>
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            
            <Button 
              onClick={handleOTPVerify}
              disabled={otp.length !== 6 || isLoading}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => setStep('phone')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Phone Number
            </Button>
          </div>
        );

      case 'pin-setup':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Set Your PIN</h2>
              <p className="text-muted-foreground">Create a 6-digit PIN for quick login</p>
            </div>
            
            <div>
              <Label htmlFor="pin">Create PIN</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>

            <div>
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Re-enter 6-digit PIN"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            
            <Button 
              onClick={handlePINSetup}
              disabled={pin.length !== 6 || confirmPin.length !== 6 || pin !== confirmPin || isLoading}
              className="w-full"
            >
              {isLoading ? "Setting PIN..." : "Set PIN"}
            </Button>
          </div>
        );

      case 'pin-login':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Enter Your PIN</h2>
              <p className="text-muted-foreground">Welcome back! Please enter your 6-digit PIN</p>
            </div>
            
            <div>
              <Label htmlFor="loginPin">PIN</Label>
              <Input
                id="loginPin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter your 6-digit PIN"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            
            <Button 
              onClick={handlePINLogin}
              disabled={pin.length !== 6 || isLoading}
              className="w-full"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <Button 
              variant="ghost" 
              onClick={handleForgotPIN}
              className="w-full"
              disabled={isLoading}
            >
              Forgot PIN? Reset via OTP
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => setStep('phone')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Use Different Number
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
      
      <Card className="w-full max-w-md animate-scale-in">
        <CardContent className="p-8">
          {renderStep()}
          
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="w-full mt-4"
          >
            Back to Exams
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthFlow;
