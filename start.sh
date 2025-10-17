#!/usr/bin/env bash

# Script de desenvolvimento: instala dependências, inicia Vite (frontend) e o servidor Node (backend).
# Uso:
#   bash start.sh
#   ./start.sh (após dar permissão de execução)

set -euo pipefail

# Garante execução a partir da pasta do script (raiz do projeto)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/4] Instalando dependências do frontend (npm install) ..."
npm install

echo "[2/4] Iniciando Vite (npm run dev) em background ..."
# Inicia o Vite em background e captura o PID para encerramento posterior
npm run dev &
VITE_PID=$!
echo "Vite iniciado com PID $VITE_PID"

# Função de limpeza para encerrar o Vite ao sair
cleanup() {
  echo "\nEncerrando processos..."
  if ps -p "$VITE_PID" > /dev/null 2>&1; then
    echo "Finalizando Vite (PID $VITE_PID)"
    kill "$VITE_PID" 2>/dev/null || true
    # Aguarda o processo encerrar gentilmente
    wait "$VITE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "[3/4] Instalando dependências do backend (server/) ..."
cd server
npm install

echo "[4/4] Iniciando servidor Node (server.js) ..."
node server.js

# Quando o servidor sair, o trap irá limpar o Vite
echo "Servidor backend finalizado."
