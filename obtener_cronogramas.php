<?php
// Establece la cabecera para devolver contenido en formato JSON
header('Content-Type: application/json');

// Incluye el archivo de conexión a la base de datos
require_once 'conn.php';

// Array para la respuesta
$response = [];

// Verifica si se ha proporcionado una fecha a través de GET
if (isset($_GET['fecha'])) {
    $fecha = $_GET['fecha'];

    // Prepara la consulta para evitar inyecciones SQL
    $stmt = $conn->prepare("SELECT id_cronograma, hora_inicio, hora_fin, titulo_programa FROM cronogramas WHERE fecha_evento = ? ORDER BY hora_inicio ASC");
    if ($stmt) {
        $stmt->bind_param("s", $fecha);
        $stmt->execute();
        $result = $stmt->get_result();

        $programas = [];
        while ($row = $result->fetch_assoc()) {
            // Formateamos la hora y el nombre para que coincida con la estructura de JS
            $programas[] = [
                'id' => $row['id_cronograma'], // <-- AÑADIMOS EL ID
                'hora' => date("H:i", strtotime($row['hora_inicio'])) . ' - ' . date("H:i", strtotime($row['hora_fin'])),
                'nombre' => $row['titulo_programa']
            ];
        }
        $response = $programas;
        $stmt->close();
    }
}

// Cierra la conexión
$conn->close();

// Devuelve la respuesta en formato JSON
echo json_encode($response);
?>