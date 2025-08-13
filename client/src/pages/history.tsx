import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Calendar, 
  Eye, 
  Search, 
  FileText, 
  TrendingUp,
  User,
  Hash,
  Euro,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import type { ReconciliationSession } from "@shared/schema";

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data: sessions = [], isLoading, error } = useQuery<ReconciliationSession[]>({
    queryKey: ['/api/history'],
    queryFn: async () => {
      const response = await fetch('/api/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
    }
  });

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.auditorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || session.sessionDate === dateFilter;
    return matchesSearch && matchesDate;
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

  const getDifferenceColor = (difference: string) => {
    const diff = parseFloat(difference);
    if (diff === 0) return "bg-green-100 text-green-800";
    if (Math.abs(diff) <= 1) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Calculate statistics
  const totalSessions = sessions.length;
  const totalCashBoxes = sessions.reduce((sum, session) => sum + session.totalCashBoxes, 0);
  const averageDifference = sessions.length > 0 
    ? sessions.reduce((sum, session) => sum + Math.abs(parseFloat(session.difference)), 0) / sessions.length 
    : 0;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error al cargar el historial. Por favor, intenta de nuevo.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="mr-3 h-8 w-8 text-primary" />
              Historial de Arqueos
            </h1>
            <p className="text-gray-600 mt-2">
              Consulta todos los arqueos realizados anteriormente
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              Nuevo Arqueo
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Arqueos</p>
                <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Hash className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Botes</p>
                <p className="text-2xl font-bold text-gray-900">{totalCashBoxes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Diferencia Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(averageDifference.toString())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por auditor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="Filtrar por fecha..."
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Arqueos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando historial...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {sessions.length === 0 
                  ? "No hay arqueos registrados aún" 
                  : "No se encontraron arqueos con los filtros aplicados"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha del Arqueo</TableHead>
                    <TableHead>Auditor</TableHead>
                    <TableHead>Botes</TableHead>
                    <TableHead>Total Vales</TableHead>
                    <TableHead>Total Desglose</TableHead>
                    <TableHead>Diferencia</TableHead>
                    <TableHead>Realizado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {formatDate(session.sessionDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          {session.auditorName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {session.totalCashBoxes}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(session.totalVales)}</TableCell>
                      <TableCell>{formatCurrency(session.totalBreakdown)}</TableCell>
                      <TableCell>
                        <Badge className={getDifferenceColor(session.difference)}>
                          {formatCurrency(session.difference)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDateTime(session.createdAt || '')}
                      </TableCell>
                      <TableCell>
                        <Link href={`/history/${session.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalles
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}