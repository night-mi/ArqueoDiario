import { Button } from "@/components/ui/button";
import { Home, RotateCcw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useReconciliation } from "@/context/reconciliation-context";
import { useToast } from "@/hooks/use-toast";

interface HomeButtonProps {
  variant?: "home" | "reset" | "both";
  showText?: boolean;
  className?: string;
}

export function HomeButton({ variant = "both", showText = true, className = "" }: HomeButtonProps) {
  const [location] = useLocation();
  const { dispatch } = useReconciliation();
  const { toast } = useToast();

  const resetWizard = () => {
    if (confirm("¿Estás seguro de que quieres reiniciar el arqueo? Se perderán todos los datos no guardados.")) {
      dispatch({ type: "RESET" });
      toast({
        title: "Arqueo reiniciado",
        description: "Se ha reiniciado el proceso de arqueo.",
      });
    }
  };

  const isOnHomePage = location === "/";

  if (variant === "home" || (variant === "both" && !isOnHomePage)) {
    return (
      <Link href="/">
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-2 ${className}`}
        >
          <Home className="h-4 w-4" />
          {showText && "Inicio"}
        </Button>
      </Link>
    );
  }

  if (variant === "reset" || (variant === "both" && isOnHomePage)) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={resetWizard}
        className={`flex items-center gap-2 ${className}`}
      >
        <RotateCcw className="h-4 w-4" />
        {showText && "Reiniciar"}
      </Button>
    );
  }

  if (variant === "both") {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Link href="/">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            {showText && "Inicio"}
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="sm"
          onClick={resetWizard}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          {showText && "Reiniciar"}
        </Button>
      </div>
    );
  }

  return null;
}