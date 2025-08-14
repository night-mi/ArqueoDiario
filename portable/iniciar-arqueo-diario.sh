#!/bin/bash
clear
echo "==============================================="
echo "  AqueoDiario - Sistema de Arqueos"
echo "  Gasolinera El Alto"
echo "==============================================="
echo ""
echo "Verificando Node.js..."

# Verificar si Node.js está disponible
if ! command -v node &> /dev/null; then
    echo ""
    echo "ERROR: Node.js no está instalado"
    echo ""
    echo "Por favor instale Node.js desde: https://nodejs.org"
    echo ""
    read -p "Presiona Enter para salir..."
    exit 1
fi

echo "Node.js encontrado correctamente"
echo ""
echo "Iniciando servidor..."
echo ""
echo "IMPORTANTE:"
echo "- La aplicación se abrirá automáticamente"  
echo "- Funciona completamente SIN INTERNET"
echo "- Para CERRAR: presiona Ctrl+C"
echo ""

# Detectar sistema operativo y abrir navegador
sleep 2
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:5000 2>/dev/null &
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5000 2>/dev/null &
fi

# Ejecutar la aplicación
node index.js