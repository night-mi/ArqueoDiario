import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
  isVisible: boolean;
  message?: string;
  type?: "default" | "processing" | "saving" | "generating";
}

const GasStationLoader = ({ type = "default" }: { type: string }) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Gas Station Icon */}
      <div className="relative w-32 h-24">
        {/* Station Building */}
        <motion.div 
          className="absolute bottom-0 w-24 h-16 bg-gradient-to-b from-blue-500 to-blue-600 rounded-t-lg mx-auto left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Station Roof */}
          <div className="absolute -top-2 -left-2 w-28 h-4 bg-red-500 rounded-full shadow-lg"></div>
          
          {/* Windows */}
          <div className="absolute top-2 left-2 w-4 h-4 bg-yellow-300 rounded opacity-90"></div>
          <div className="absolute top-2 right-2 w-4 h-4 bg-yellow-300 rounded opacity-90"></div>
          
          {/* Door */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-blue-800 rounded-t-lg"></div>
        </motion.div>

        {/* Gas Pumps */}
        <motion.div 
          className="absolute bottom-0 left-2 w-6 h-12 bg-gray-700 rounded-t"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="w-4 h-2 bg-green-500 mt-2 mx-auto rounded"></div>
        </motion.div>
        
        <motion.div 
          className="absolute bottom-0 right-2 w-6 h-12 bg-gray-700 rounded-t"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="w-4 h-2 bg-green-500 mt-2 mx-auto rounded"></div>
        </motion.div>
      </div>

      {/* Animated Elements Based on Type */}
      {type === "processing" && (
        <div className="flex space-x-2">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      )}

      {type === "saving" && (
        <motion.div 
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}

      {type === "generating" && (
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-8 bg-gradient-to-t from-green-500 to-green-300 rounded-full"
              animate={{
                scaleY: [1, 2, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      )}

      {/* Fuel Drop Animation */}
      <div className="relative w-8 h-12 overflow-hidden">
        <motion.div
          className="absolute w-3 h-3 bg-amber-400 rounded-full"
          animate={{
            y: [0, 48],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeIn",
          }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-amber-300 rounded-full left-1"
          animate={{
            y: [0, 48],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.5,
            ease: "easeIn",
          }}
        />
      </div>
    </div>
  );
};

const LoadingMessages = {
  default: "Cargando sistema de arqueos...",
  processing: "Procesando datos de caja...",
  saving: "Guardando información...",
  generating: "Generando informe...",
};

export default function LoadingScreen({ isVisible, message, type = "default" }: LoadingScreenProps) {
  const displayMessage = message || LoadingMessages[type as keyof typeof LoadingMessages];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50"
        >
          <div className="text-center">
            <GasStationLoader type={type} />
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-8"
            >
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {displayMessage}
              </h2>
              
              {/* Loading dots */}
              <div className="flex justify-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"default" | "processing" | "saving" | "generating">("default");
  const [loadingMessage, setLoadingMessage] = useState<string>();

  const showLoading = (type: "default" | "processing" | "saving" | "generating" = "default", message?: string) => {
    setLoadingType(type);
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return {
    isLoading,
    loadingType,
    loadingMessage,
    showLoading,
    hideLoading,
  };
};