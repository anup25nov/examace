import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}

const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  className = ''
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Update internal state when external value changes
    const newOtp = value.split('').slice(0, length);
    const paddedOtp = [...newOtp, ...new Array(length - newOtp.length).fill('')];
    setOtp(paddedOtp);
  }, [value, length]);

  // Handle SMS autofill and OTP auto-detection
  useEffect(() => {
    const handleSMSAutofill = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target && target.value) {
        // Handle SMS autofill - extract digits from the input
        const autofillValue = target.value.replace(/\D/g, '');
        if (autofillValue.length >= length) {
          const autofillDigits = autofillValue.split('').slice(0, length);
          setOtp(autofillDigits);
          onChange(autofillDigits.join(''));
          
          // Auto-submit if OTP is complete
          if (autofillDigits.length === length && autofillDigits.every(digit => digit !== '')) {
            // Trigger form submission after a short delay
            setTimeout(() => {
              const form = target.closest('form');
              if (form) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(submitEvent);
              }
            }, 500);
          }
        }
      }
    };

    // Enhanced SMS autofill detection
    const handleInputChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target && target.value) {
        // Check if this looks like a complete OTP (all digits)
        const value = target.value.replace(/\D/g, '');
        if (value.length === length) {
          const digits = value.split('');
          setOtp(digits);
          onChange(digits.join(''));
          
          // Auto-submit after a short delay
          setTimeout(() => {
            const form = target.closest('form');
            if (form) {
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
              form.dispatchEvent(submitEvent);
            }
          }, 300);
        }
      }
    };

    // Listen for input events on all OTP inputs
    const inputs = inputRefs.current;
    inputs.forEach((input) => {
      if (input) {
        input.addEventListener('input', handleInputChange);
        input.addEventListener('change', handleSMSAutofill);
        // Also listen for paste events
        input.addEventListener('paste', (e) => {
          setTimeout(() => handleInputChange(e), 10);
        });
      }
    });

    return () => {
      inputs.forEach((input) => {
        if (input) {
          input.removeEventListener('input', handleInputChange);
          input.removeEventListener('change', handleSMSAutofill);
        }
      });
    };
  }, [length, onChange]);

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, '');
    
    if (digit.length > 1) {
      // Handle paste operation or SMS autofill
      const pastedDigits = digit.split('').slice(0, length);
      const newOtp = [...otp];
      
      pastedDigits.forEach((d, i) => {
        if (index + i < length) {
          newOtp[index + i] = d;
        }
      });
      
      setOtp(newOtp);
      onChange(newOtp.join(''));
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(index + pastedDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Single digit input
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      onChange(newOtp.join(''));
      
      // Auto-focus next input
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length > 0) {
      const pastedDigits = pastedData.split('').slice(0, length);
      const newOtp = [...otp];
      
      pastedDigits.forEach((digit, i) => {
        if (i < length) {
          newOtp[i] = digit;
        }
      });
      
      setOtp(newOtp);
      onChange(newOtp.join(''));
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={`flex space-x-2 justify-center ${className}`}>
      {/* Hidden input for SMS autofill - Enhanced for mobile */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        name="otp"
        id="otp-autofill"
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px'
        }}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '');
          if (value.length === length) {
            const digits = value.split('');
            setOtp(digits);
            onChange(digits.join(''));
            
            // Auto-submit after a short delay
            setTimeout(() => {
              const form = e.target.closest('form');
              if (form) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(submitEvent);
              }
            }, 300);
          }
        }}
      />
      {otp.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-12 text-center text-lg font-semibold border-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
          autoComplete="one-time-code"
          autoFocus={index === 0}
          data-testid={`otp-input-${index}`}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;
