#!/bin/bash
# =============================================================
# Script REPARADOR (v3) - Carga de 100 Pokemon desde setup.sql
# =============================================================

MAINT_USER="debian-sys-maint"
MAINT_PASS="NvxlwMsUeiN4dNKU"
NEW_PASS="Pokedex2026!"

echo "========================================"
echo " Actualizando Pokédex con 100 Pokémon"
echo "========================================"

# 1. Ejecutar el script setup.sql completo
echo ""
echo "[1/3] Cargando datos desde setup.sql..."
mysql -u $MAINT_USER -p$MAINT_PASS < setup.sql

if [ $? -eq 0 ]; then
    echo "✅ Base de datos y 100 Pokémon cargados correctamente."
else
    echo "❌ Error al cargar setup.sql. Asegúrate de que el archivo existe en esta carpeta."
    exit 1
fi

# 2. Re-asegurar el usuario con password que cumpla la política
echo ""
echo "[2/3] Configurando usuario 'pokedex'..."
mysql -u $MAINT_USER -p$MAINT_PASS << EOSQL
SET GLOBAL validate_password.policy=0;
SET GLOBAL validate_password.length=4;
DROP USER IF EXISTS 'pokedex'@'localhost';
CREATE USER 'pokedex'@'localhost' IDENTIFIED BY '$NEW_PASS';
GRANT ALL PRIVILEGES ON pokedex_2026.* TO 'pokedex'@'localhost';
FLUSH PRIVILEGES;
EOSQL

if [ $? -eq 0 ]; then
    echo "✅ Usuario 'pokedex' configurado con el password: $NEW_PASS"
else
    echo "❌ Error al configurar el usuario."
    exit 1
fi

# 3. Verificación
echo ""
echo "[3/3] Verificando conexión..."
mysql -u pokedex -p$NEW_PASS -e "USE pokedex_2026; SELECT COUNT(*) as total_pokemon FROM pokemon;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ ¡LISTO! 100 Pokémon en la base de datos."
    echo "   Ya puedes reiniciar el backend con: cd backend && node server.js"
    echo "========================================"
else
    echo "❌ La verificación falló."
fi
