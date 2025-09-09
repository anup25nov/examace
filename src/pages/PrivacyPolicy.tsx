import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Lock, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <img 
                src="/logos/alternate_image.png"
                alt="ExamAce Logo" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">ExamAce</h1>
                <p className="text-sm text-muted-foreground">Privacy Policy</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Your Privacy Matters
          </h2>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Information We Collect</h3>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>Personal Information:</strong> Email address, name, and contact details when you register.</p>
                <p><strong>Usage Data:</strong> Test scores, progress tracking, time spent on questions, and performance analytics.</p>
                <p><strong>Device Information:</strong> Browser type, device type, and IP address for technical optimization.</p>
                <p><strong>Cookies:</strong> We use cookies to enhance your experience and remember your preferences.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">How We Use Your Information</h3>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>• Provide personalized learning experiences and track your progress</p>
                <p>• Generate performance analytics and improvement recommendations</p>
                <p>• Send important updates about your account and platform features</p>
                <p>• Improve our services through data analysis and user feedback</p>
                <p>• Ensure platform security and prevent fraudulent activities</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Data Security</h3>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>We implement industry-standard security measures to protect your data:</p>
                <p>• SSL encryption for all data transmission</p>
                <p>• Secure database storage with access controls</p>
                <p>• Regular security audits and updates</p>
                <p>• Limited access to personal data by authorized personnel only</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">Your Rights</h3>
              <div className="space-y-3 text-muted-foreground">
                <p>• <strong>Access:</strong> Request a copy of your personal data</p>
                <p>• <strong>Correction:</strong> Update or correct your information</p>
                <p>• <strong>Deletion:</strong> Request deletion of your account and data</p>
                <p>• <strong>Portability:</strong> Export your data in a standard format</p>
                <p>• <strong>Opt-out:</strong> Unsubscribe from marketing communications</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">Third-Party Services</h3>
              <div className="space-y-3 text-muted-foreground">
                <p>We may use third-party services for:</p>
                <p>• Email delivery and communication</p>
                <p>• Analytics and performance monitoring</p>
                <p>• Payment processing (if applicable)</p>
                <p>• Cloud storage and hosting services</p>
                <p>All third-party services are carefully vetted for security and privacy compliance.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">Contact Us</h3>
              <div className="space-y-3 text-muted-foreground">
                <p>If you have any questions about this Privacy Policy, please contact us:</p>
                <p>• Email: privacy@examace.com</p>
                <p>• Phone: +91 98765 43210</p>
                <p>• Address: New Delhi, India</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            size="lg"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
