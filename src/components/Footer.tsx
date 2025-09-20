import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {/* About Us */}
          <div>
            <h3 className="text-xl font-bold mb-4">About S2S</h3>
            <p className="text-gray-300 mb-4">
              Your comprehensive platform for government exam preparation. Practice with real exam patterns, track your progress, and achieve your dream job.
            </p>
            <div className="flex space-x-4 justify-center">
              <a href="https://www.facebook.com/share/19izA8vXoy/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/mr_ankit011?igsh=MTI5dmd1djlhdXhvMw==" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@step2sarkari" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="w-7 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><button onClick={() => handleNavigation("/")} className="text-gray-300 hover:text-white transition-colors">Home</button></li>
              <li><button onClick={() => handleNavigation("/exam/ssc-cgl")} className="text-gray-300 hover:text-white transition-colors">Mock Tests</button></li>
              <li><button onClick={() => handleNavigation("/exam/ssc-cgl")} className="text-gray-300 hover:text-white transition-colors">Previous Year Questions</button></li>
              <li><button onClick={() => handleNavigation("/exam/ssc-cgl")} className="text-gray-300 hover:text-white transition-colors">Practice Sets</button></li>
              <li><button onClick={() => handleNavigation("/exam/ssc-cgl")} className="text-gray-300 hover:text-white transition-colors">Performance Analytics</button></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xl font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><button onClick={() => handleNavigation("/faq")} className="text-gray-300 hover:text-white transition-colors">FAQ</button></li>
              <li><button onClick={() => handleNavigation("/privacy")} className="text-gray-300 hover:text-white transition-colors">Privacy Policy</button></li>
              {/* <li><button onClick={() => handleNavigation("/terms")} className="text-gray-300 hover:text-white transition-colors">Terms of Service</button></li> */}
              {/* <li><button onClick={() => handleNavigation("/faq")} className="text-gray-300 hover:text-white transition-colors">Help Center</button></li> */}
              <li><button onClick={() => handleNavigation("/contact")} className="text-gray-300 hover:text-white transition-colors">Contact Us</button></li>
            </ul>
          </div>

          {/* Contact Info */}
          {/* <div>
            <h3 className="text-xl font-bold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Mail className="w-5 h-5 text-primary" />
                <a href="mailto:support@s2s.com" className="text-gray-300 hover:text-white transition-colors">
                  support@s2s.com
                </a>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Phone className="w-5 h-5 text-primary" />
                <a href="tel:+919876543210" className="text-gray-300 hover:text-white transition-colors">
                  +91 98765 43210
                </a>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-gray-300">New Delhi, India</span>
              </div>
            </div>
          </div> */}

        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 S2S - Step2Sarkari. All rights reserved. | Made with ❤️ for government job aspirants
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
