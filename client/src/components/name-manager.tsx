import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SavedName } from "@shared/schema";

interface NameManagerProps {
  type: 'worker' | 'auditor';
  title: string;
  onNameSelect: (name: string) => void;
  selectedName?: string;
}

export function NameManager({ type, title, onNameSelect, selectedName }: NameManagerProps) {
  const [newName, setNewName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: names = [], isLoading } = useQuery<SavedName[]>({
    queryKey: ['/api/names', type],
    queryFn: async () => {
      const response = await fetch(`/api/names/${type}`);
      if (!response.ok) throw new Error('Failed to fetch names');
      return response.json();
    }
  });

  const addNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type })
      });
      if (!response.ok) throw new Error('Failed to add name');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/names', type] });
      setNewName("");
      toast({ title: "Nombre añadido correctamente" });
    },
    onError: () => {
      toast({ title: "Error al añadir nombre", variant: "destructive" });
    }
  });

  const removeNameMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/names/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove name');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/names', type] });
      toast({ title: "Nombre eliminado correctamente" });
    },
    onError: () => {
      toast({ title: "Error al eliminar nombre", variant: "destructive" });
    }
  });

  const handleAddName = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    
    // Check if name already exists
    if (names.some(n => n.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({ title: "Este nombre ya existe", variant: "destructive" });
      return;
    }
    
    addNameMutation.mutate(trimmedName);
  };

  const handleRemoveName = (id: string, name: string) => {
    // If removing the currently selected name, clear selection
    if (selectedName === name) {
      onNameSelect("");
    }
    removeNameMutation.mutate(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new name */}
        <div className="flex gap-2">
          <Input
            placeholder="Escribir nuevo nombre"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddName();
              }
            }}
            disabled={addNameMutation.isPending}
          />
          <Button 
            onClick={handleAddName}
            disabled={!newName.trim() || addNameMutation.isPending}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Names list */}
        {isLoading ? (
          <div className="text-center text-muted-foreground">Cargando nombres...</div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {names.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm">
                No hay nombres guardados
              </div>
            ) : (
              names.map((name) => (
                <div
                  key={name.id}
                  className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                    selectedName === name.name 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                  onClick={() => onNameSelect(name.name)}
                >
                  <span className="font-medium">{name.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveName(name.id, name.name);
                    }}
                    disabled={removeNameMutation.isPending}
                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Manual input option */}
        <div className="border-t pt-3">
          <Input
            placeholder="O escribir nombre manualmente"
            value={selectedName || ""}
            onChange={(e) => onNameSelect(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}