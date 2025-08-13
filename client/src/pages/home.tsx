import CashReconciliationWizard from "@/components/cash-reconciliation-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Plus } from "lucide-react";
import { Link } from "wouter";
import { HomeButton } from "@/components/home-button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema de Arqueos de Caja
              </h1>
              <p className="text-gray-600">
                Gestión completa de reconciliación de cajas registradoras
              </p>
            </div>
            <div className="flex gap-2">
              <HomeButton variant="reset" />
              <Link href="/history">
                <Button variant="outline">
                  <History className="mr-2 h-4 w-4" />
                  Ver Historial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <CashReconciliationWizard />
      </div>
    </div>
  );
}
