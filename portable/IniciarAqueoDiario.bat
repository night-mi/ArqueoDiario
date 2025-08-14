@echo off
title AqueoDiario - Sistema de Arqueos
cls
echo ===============================================
echo   AqueoDiario - Sistema de Arqueos
echo   Gasolinera El Alto  
echo ===============================================
echo.
echo Verificando Node.js...

REM Verificar si Node.js esta disponible
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js no esta instalado
    echo.
    echo Por favor instale Node.js desde: https://nodejs.org
    echo O use la version con Node.js incluido
    echo.
    pause
    exit /b 1
)

echo Node.js encontrado correctamente
echo.
echo Iniciando servidor...
echo.
echo IMPORTANTE:
echo - La aplicacion se abrira automaticamente
echo - Funciona completamente SIN INTERNET  
echo - Para CERRAR: presiona Ctrl+C
echo.

REM Esperar 2 segundos antes de abrir navegador
timeout /t 2 /nobreak >nul
start "" http://localhost:5000

REM Ejecutar la aplicación
node index.js

echo.
echo La aplicacion se ha cerrado.
pause