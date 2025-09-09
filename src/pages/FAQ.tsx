import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const FAQ = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const faqData = [
    {
      id: "getting-started",
      category: "Getting Started",
      questions: [
        {
          id: "how-to-register",
          question: "How do I register for ExamAce?",
          answer: "Simply click on the 'Login' button on our homepage, enter your email address, verify with OTP, and you're ready to start your preparation journey!"
        },
        {
          id: "free-or-paid",
          question: "Is ExamAce free to use?",
          answer: "Yes! ExamAce is completely free to use. We believe in providing quality education accessible to everyone."
        },
        {
          id: "supported-exams",
          question: "Which exams are supported?",
          answer: "Currently, we support SSC CGL with comprehensive mock tests and previous year questions. More exams like SSC MTS, Railway, Bank PO, and Air Force are coming soon!"
        }
      ]
    },
    {
      id: "features",
      category: "Features & Usage",
      questions: [
        {
          id: "mock-tests",
          question: "What are Mock Tests?",
          answer: "Mock tests are full-length practice tests designed to simulate the actual exam experience. They include 100 questions with a 180-minute time limit, just like the real SSC CGL exam."
        },
        {
          id: "pyq",
          question: "What are Previous Year Questions (PYQ)?",
          answer: "PYQ are actual questions from previous SSC CGL exams, organized by year. They help you understand the exam pattern and difficulty level."
        },
        {
          id: "performance-tracking",
          question: "How does performance tracking work?",
          answer: "We track your scores, accuracy, time taken, and provide detailed analytics. You can see your rank among all participants and track your improvement over time."
        },
        {
          id: "solutions",
          question: "Can I view solutions after completing a test?",
          answer: "Yes! After completing any test, you can view detailed solutions with explanations for each question. This helps you understand your mistakes and learn from them."
        }
      ]
    },
    {
      id: "technical",
      category: "Technical Support",
      questions: [
        {
          id: "browser-support",
          question: "Which browsers are supported?",
          answer: "ExamAce works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience."
        },
        {
          id: "mobile-support",
          question: "Can I use ExamAce on mobile?",
          answer: "Yes! ExamAce is fully responsive and works great on mobile devices, tablets, and desktops. You can practice on the go!"
        },
        {
          id: "data-sync",
          question: "Is my progress saved automatically?",
          answer: "Yes, all your progress, scores, and test attempts are automatically saved to your account. You can access them from any device."
        },
        {
          id: "offline-mode",
          question: "Can I use ExamAce offline?",
          answer: "Currently, ExamAce requires an internet connection to function. We're working on offline capabilities for future updates."
        }
      ]
    },
    {
      id: "account",
      category: "Account & Privacy",
      questions: [
        {
          id: "password-reset",
          question: "How do I reset my password?",
          answer: "Since we use OTP-based authentication, you don't need to remember a password. Simply enter your email and verify with OTP to access your account."
        },
        {
          id: "data-privacy",
          question: "Is my data secure?",
          answer: "Absolutely! We use industry-standard security measures to protect your data. Your personal information and test results are encrypted and stored securely."
        },
        {
          id: "delete-account",
          question: "How can I delete my account?",
          answer: "To delete your account, please contact our support team at support@examace.com. We'll process your request within 24 hours."
        }
      ]
    }
  ];

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
                <p className="text-sm text-muted-foreground">FAQ</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Got Questions? We Have Answers!
          </h2>
          <p className="text-muted-foreground">
            Find answers to common questions about ExamAce and how to make the most of your preparation.
          </p>
        </div>

        <div className="space-y-8">
          {faqData.map((category) => (
            <div key={category.id}>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {category.category}
              </h3>
              <div className="space-y-4">
                {category.questions.map((item) => (
                  <Card key={item.id} className="gradient-card border-0">
                    <Collapsible 
                      open={openItems[item.id]} 
                      onOpenChange={() => toggleItem(item.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardContent className="p-6 cursor-pointer hover:bg-muted/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-foreground pr-4">
                              {item.question}
                            </h4>
                            {openItems[item.id] ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-6">
                          <p className="text-muted-foreground leading-relaxed">
                            {item.answer}
                          </p>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="gradient-card border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Still Have Questions?
              </h3>
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? Our support team is here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate("/contact")}
                  className="gradient-primary border-0"
                >
                  Contact Support
                </Button>
                <Button 
                  onClick={() => navigate("/")}
                  variant="outline"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
