<?php
// Incluye el archivo de conexion que creamos en el paso anterior
require_once 'conn.php';

// 1. Verificar que los datos se hayan enviado por POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // 2. Recoger los datos del formulario (AQUI DEBES ASEGURARTE DE VALIDARLOS)
    // Usamos $conn->real_escape_string para una proteccion basica,
    // pero lo IDEAL es usar SENTENCIAS PREPARADAS (ver nota al final).
    $fecha = $conn->real_escape_string($_POST['fecha']);
    $inicio = $conn->real_escape_string($_POST['inicio']);
    $fin = $conn->real_escape_string($_POST['fin']);
    $titulo = $conn->real_escape_string($_POST['titulo']);
    
    // Opcional: puedes agregar el encargado si tu formulario lo pide
    $encargado = isset($_POST['encargado']) ? $conn->real_escape_string($_POST['encargado']) : 'Desconocido';

    // 3. Crear la consulta SQL para insertar los datos
    $sql = "INSERT INTO cronogramas (fecha_evento, hora_inicio, hora_fin, titulo_programa, encargado) 
            VALUES ('$fecha', '$inicio', '$fin', '$titulo', '$encargado')";

    // 4. Ejecutar la consulta
    if ($conn->query($sql) === TRUE) {
        // Redirige o muestra un mensaje de exito
        echo "¡Cronograma registrado con éxito!";
        // header("Location: index.html?status=success");
    } else {
        // Muestra un mensaje de error si falla la insercion
        echo "Error al registrar: " . $conn->error;
    }
} else {
    // Si no se envio por POST, redirigir al formulario
    // header("Location: index.html");
    echo "Acceso denegado.";
}

// 5. Cerrar la conexión
$conn->close();
?>