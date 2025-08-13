import { useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export default function InfoTooltip({ content, className = "" }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors"
        type="button"
      >
        <Info className="w-3 h-3" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg top-6 left-0 transform">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}