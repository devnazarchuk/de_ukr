import React from 'react';

interface LiquidLoaderProps {
  text?: string;
}

const LiquidLoader: React.FC<LiquidLoaderProps> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-48 h-48 rounded-full border-4 border-gray-100 bg-white overflow-hidden shadow-2xl ring-1 ring-gray-100">
        
        {/* Background Waves */}
        <div 
            className="absolute left-1/2 w-[200%] h-[200%] bg-indigo-300 rounded-[40%] -translate-x-1/2 opacity-40 animate-wave-fill"
            style={{ animationDuration: '6s', animationDelay: '-2s' }}
        ></div>
        <div 
            className="absolute left-1/2 w-[200%] h-[200%] bg-indigo-500 rounded-[35%] -translate-x-1/2 opacity-90 animate-wave-fill"
            style={{ animationDuration: '4s' }}
        ></div>

        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="text-white font-bold text-xl drop-shadow-md tracking-wider">
            {text || 'Loading...'}
          </span>
        </div>
      </div>
      
      <style>{`
        @keyframes wave-rotate {
          0% { transform: translateX(-50%) rotate(0deg); }
          100% { transform: translateX(-50%) rotate(360deg); }
        }
        @keyframes fill-up {
          0% { bottom: -180%; }
          100% { bottom: -30%; }
        }
        .animate-wave-fill {
           position: absolute;
           bottom: -180%;
           animation: wave-rotate 5s linear infinite, fill-up 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LiquidLoader;