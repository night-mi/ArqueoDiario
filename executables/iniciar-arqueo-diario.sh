#!/bin/bash
echo "🚀 Iniciando AqueoDiario - Sistema de Arqueos..."
echo ""
echo "La aplicación se abrirá en tu navegador en http://localhost:5000"
echo ""
echo "Para cerrar la aplicación, presiona Ctrl+C"
echo ""

# Detectar sistema operativo y abrir navegador
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:5000 2>/dev/null &
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5000 2>/dev/null &
fi

# Ejecutar la aplicación
if [[ "$OSTYPE" == "darwin"* ]]; then
    ./index-macos
else
    ./index-linux
fi