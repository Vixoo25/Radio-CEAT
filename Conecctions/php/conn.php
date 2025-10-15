<?php
// ------------------------------------------------
// Configuracion de la Conexion a la Base de Datos para Railway
// ------------------------------------------------

// Railway inyecta las variables de entorno automáticamente.
// Usamos getenv() para leerlas directamente.
$db_servidor = getenv('MYSQLHOST');
$db_usuario = getenv('MYSQLUSER');
$db_password = getenv('MYSQLPASSWORD');
$db_nombre = getenv('MYSQLDATABASE');
$db_puerto = getenv('MYSQLPORT');

// Crea la conexion usando MySQLi (la forma recomendada)
$conn = new mysqli($db_servidor, $db_usuario, $db_password, $db_nombre, $db_puerto);

// Verifica si la conexion fallo
if ($conn->connect_error) {
    // En un entorno de producción, es mejor no mostrar el error detallado.
    // Devolvemos una respuesta JSON estandarizada que el frontend puede interpretar.
    header('Content-Type: application/json');
    die(json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos.']));
}

// Opcional: Establecer el juego de caracteres a UTF8 para evitar problemas con acentos y Ñ
$conn->set_charset("utf8");

// Si todo va bien, $conn es el objeto que usaras para hacer consultas.
?>