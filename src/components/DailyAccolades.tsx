import React, { useState, useEffect } from 'react';
import { Trophy, Star, Sparkles, CheckCircle } from 'lucide-react';

interface DailyAccoladesProps {
  isFirstVisit: boolean;
  onClose: () => void;
}

export const DailyAccolades: React.FC<DailyAccoladesProps> = ({ isFirstVisit, onClose }) => {
  const [showAccolades, setShowAccolades] = useState(false);

  useEffect(() => {
    if (isFirstVisit) {
      setShowAccolades(true);
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        setShowAccolades(false);
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit, onClose]);

  if (!showAccolades) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Celebration Animation */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-spin">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            {/* Floating Stars */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{
                  transform: `translate(-50%, -50%) translate(${Math.cos(i * 60 * Math.PI / 180) * 60}px, ${Math.sin(i * 60 * Math.PI / 180) * 60}px)`,
                  animationDelay: `${i * 0.1}s`
                }}
              >
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-300">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {isFirstVisit ? 'Welcome to Step2Sarkari! 🎉' : 'Welcome Back! 🎉'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isFirstVisit 
                ? 'Welcome to your exam preparation journey! Let\'s achieve your goals together.'
                : 'Great to see you again! Keep up the momentum and achieve your goals.'
              }
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Daily Streak Bonus</span>
              </div>
              <p className="text-sm text-blue-700">
                You're building a great study habit! Every day counts towards your success.
              </p>
            </div>

            <button
              onClick={() => {
                setShowAccolades(false);
                onClose();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <CheckCircle className="w-5 h-5 inline mr-2" />
              {isFirstVisit ? "Let's Start Learning!" : "Let's Continue Learning!"}
            </button>
          </div>
        </div>
      </div>
  );
};
