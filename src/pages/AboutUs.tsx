import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";

const AboutUs = () => {
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
                src="/logos/examace-logo.svg" 
                alt="ExamAce Logo" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">ExamAce</h1>
                <p className="text-sm text-muted-foreground">About Us</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Empowering Competitive Exam Aspirants
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            ExamAce is your comprehensive platform for competitive exam preparation, 
            designed to help you achieve your dreams through structured practice and real-time analytics.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="w-8 h-8 text-primary" />
                <h3 className="text-2xl font-bold text-foreground">Our Mission</h3>
              </div>
              <p className="text-muted-foreground">
                To democratize quality education by providing accessible, comprehensive, 
                and effective preparation tools for competitive exams, helping students 
                from all backgrounds achieve their academic and career goals.
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Award className="w-8 h-8 text-primary" />
                <h3 className="text-2xl font-bold text-foreground">Our Vision</h3>
              </div>
              <p className="text-muted-foreground">
                To become India's leading platform for competitive exam preparation, 
                recognized for innovation, quality, and student success rates, 
                transforming how students prepare for their future.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-center text-foreground mb-8">
            Why Choose ExamAce?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="gradient-card border-0">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="text-xl font-bold text-foreground mb-2">Comprehensive Content</h4>
                <p className="text-muted-foreground">
                  Access to thousands of questions from previous year papers and expert-curated mock tests.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-0">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="text-xl font-bold text-foreground mb-2">Real-time Analytics</h4>
                <p className="text-muted-foreground">
                  Track your progress with detailed analytics, rankings, and performance insights.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-0">
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="text-xl font-bold text-foreground mb-2">Personalized Learning</h4>
                <p className="text-muted-foreground">
                  Adaptive learning paths that focus on your weak areas and strengthen your preparation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-center text-foreground mb-8">
            Our Impact
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Active Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">1M+</div>
              <div className="text-sm text-muted-foreground">Questions Solved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">95%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to Start Your Journey?
          </h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of successful students who have achieved their dreams with ExamAce.
          </p>
          <Button 
            onClick={() => navigate("/")}
            className="gradient-primary border-0"
            size="lg"
          >
            Get Started Now
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUs;
