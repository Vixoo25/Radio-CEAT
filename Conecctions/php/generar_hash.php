<?php

/**
 * Script para generar un hash de contraseña compatible con el sistema de login.
 */

// ===== INSTRUCCIONES =====
// 1. Cambia 'tu_nueva_contraseña' por la contraseña que quieras encriptar.
// 2. Guarda el archivo.
// 3. Abrelo en tu navegador (ej: http://localhost/mi_radio/generar_hash.php).
// 4. Copia el hash generado y pégalo en la base de datos.

$passwordPlana = 'Nogganeg.123'; // <-- CAMBIA ESTO

$hash = password_hash($passwordPlana, PASSWORD_DEFAULT);

echo "<h1>Generador de Hash de Contraseña</h1>";
echo "La contraseña que has introducido se convierte en el siguiente hash:<br><br>";
echo "<strong style='font-size: 1.2em;'>" . htmlspecialchars($hash) . "</strong><br><br>";
echo "Copia y pega este hash en el campo 'password_hash' de la tabla 'usuarios' en phpMyAdmin.";