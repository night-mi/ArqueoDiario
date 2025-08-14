@echo off
title AqueoDiario - Sistema de Arqueos
cls
echo ===============================================
echo   AqueoDiario - Sistema de Arqueos
echo   Gasolinera El Alto
echo ===============================================
echo.
echo Iniciando servidor local...
echo.
echo IMPORTANTE:
echo - La aplicacion se abrira automaticamente
echo - Funciona completamente SIN INTERNET
echo - Para CERRAR: presiona Ctrl+C aqui
echo.
echo Abriendo navegador en http://localhost:5000
echo.

REM Esperar 3 segundos antes de abrir navegador
timeout /t 3 /nobreak >nul
start "" http://localhost:5000

REM Ejecutar la aplicacion
"%~dp0index-win.exe"

echo.
echo La aplicacion se ha cerrado.
pause