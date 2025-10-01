<?php
// ------------------------------------------------
// Configuracion de la Conexion a la Base de Datos
// ------------------------------------------------
$db_servidor = "localhost"; // Servidor de MySQL (WAMP)
$db_usuario = "root";       // Usuario por defecto de WAMP (puedes cambiarlo despues)
$db_password = "";          // Contraseña por defecto de WAMP (vacia)
$db_nombre = "radio_cronogramas"; // Nombre de la BD que creaste

// Crea la conexion usando MySQLi (la forma recomendada)
$conn = new mysqli($db_servidor, $db_usuario, $db_password, $db_nombre);

// Verifica si la conexion fallo
if ($conn->connect_error) {
    // Si hay un error, detiene la ejecucion y muestra el mensaje
    die("Error de conexión a la Base de Datos: " . $conn->connect_error);
}

// Opcional: Establecer el juego de caracteres a UTF8 para evitar problemas con acentos y Ñ
$conn->set_charset("utf8");

// Si todo va bien, $conn es el objeto que usaras para hacer consultas.
?>