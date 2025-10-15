<?php
// --- Habilitar reporte de errores para diagnóstico ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuracion de la Conexion a la Base de Datos en la Nube (Clever Cloud)
// ------------------------------------------------

// --- Credenciales de la base de datos de Clever Cloud ---
$db_servidor = "bzsugcwtk85jz1uh4pjp-mysql.services.clever-cloud.com";
$db_usuario = "us7utlipdednn1ch";
$db_password = "nI5WcC0kssSglw8LlCAw";
$db_nombre = "bzsugcwtk85jz1uh4pjp";
$db_puerto = 3306; // Puerto estándar de MySQL

// Crea la conexion usando MySQLi (la forma recomendada)
$conn = new mysqli($db_servidor, $db_usuario, $db_password, $db_nombre, $db_puerto);

// Verifica si la conexion fallo
if ($conn->connect_error) {
    // En un entorno de producción, es mejor no mostrar el error detallado.
    // Devolvemos una respuesta JSON estandarizada que el frontend puede interpretar.
    header('Content-Type: application/json');
    die(json_encode(['success' => false, 'message' => 'Error de conexión: ' . $conn->connect_error]));
}

// Establecer el juego de caracteres a UTF8 para evitar problemas con acentos y Ñ
$conn->set_charset("utf8");

// Si todo va bien, $conn es el objeto que usaras para hacer consultas.
?>