import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Hash, 
  Euro, 
  FileText,
  Clock,
  Calculator
} from "lucide-react";
import { Link, useParams } from "wouter";
import type { ReconciliationSession, CashBox } from "@shared/schema";

interface HistoryDetailData {
  session: ReconciliationSession;
  cashBoxes: CashBox[];
}

export default function HistoryDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data, isLoading, error } = useQuery<HistoryDetailData>({
    queryKey: ['/api/history', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/history/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session details');
      return response.json();
    },
    enabled: !!sessionId
  });

  const formatCurrency = (amount: string) => {
    return `€${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const parseBreakdown = (breakdownString: string) => {
    try {
      return JSON.parse(breakdownString);
    } catch {
      return {};
    }
  };

  const getDifferenceColor = (difference: string) => {
    const diff = parseFloat(difference);
    if (diff === 0) return "bg-green-100 text-green-800";
    if (Math.abs(diff) <= 1) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getShiftName = (shift: number) => {
    return shift === 1 ? "Mañana" : "Tarde";
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error al cargar los detalles del arqueo.</p>
            <Link href="/history">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Historial
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Cargando detalles del arqueo...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Arqueo no encontrado.</p>
            <Link href="/history">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Historial
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session, cashBoxes } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/history">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Historial
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="mr-3 h-8 w-8 text-primary" />
              Detalles del Arqueo
            </h1>
            <p className="text-gray-600 mt-2">
              Arqueo realizado el {formatDate(session.sessionDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Session Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Resumen del Arqueo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Fecha del Arqueo</p>
                <p className="text-lg font-semibold">{formatDate(session.sessionDate)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Auditor</p>
                <p className="text-lg font-semibold">{session.auditorName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Hash className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Botes</p>
                <p className="text-lg font-semibold">{session.totalCashBoxes}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Realizado</p>
                <p className="text-lg font-semibold">{formatDateTime(session.createdAt || '')}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Vales</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(session.totalVales)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Desglose</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(session.totalBreakdown)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Diferencia</p>
                <Badge className={`text-lg px-4 py-2 ${getDifferenceColor(session.difference)}`}>
                  {formatCurrency(session.difference)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Boxes Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Detalles de Botes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Trabajador</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Vale</TableHead>
                  <TableHead>Desglose</TableHead>
                  <TableHead>Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashBoxes.map((cashBox) => {
                  const breakdown = parseBreakdown(cashBox.breakdown);
                  const valeAmount = parseFloat(cashBox.valeAmount);
                  const breakdownTotal = parseFloat(cashBox.totalBreakdown);
                  const difference = breakdownTotal - valeAmount;

                  return (
                    <TableRow key={cashBox.id}>
                      <TableCell>{formatDate(cashBox.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          {cashBox.workerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getShiftName(cashBox.shift)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(cashBox.valeAmount)}</TableCell>
                      <TableCell>{formatCurrency(cashBox.totalBreakdown)}</TableCell>
                      <TableCell>
                        <Badge className={getDifferenceColor(difference.toString())}>
                          {formatCurrency(difference.toString())}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}