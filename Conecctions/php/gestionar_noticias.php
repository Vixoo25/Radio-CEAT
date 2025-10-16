<?php
session_start();
header('Content-Type: application/json');
require_once 'conn.php';

$response = ['success' => false, 'message' => 'Acción no válida.'];

// --- Verificación de permisos ---
$is_allowed = (isset($_SESSION['user_logged_in']) && ($_SESSION['user_role'] === 'noticias' || $_SESSION['user_role'] === 'admin_total'));

// --- Rutas para las imágenes ---
$uploadServerDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'noticias' . DIRECTORY_SEPARATOR;
$uploadWebDir = 'Conecctions/uploads/noticias/';

// Crear directorio si no existe
if (!is_dir($uploadServerDir)) {
    mkdir($uploadServerDir, 0777, true);
}

$action = $_REQUEST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// --- Lógica para OBTENER noticias (público) ---
if ($method === 'GET' && ($action === 'get' || empty($action))) {
    if (isset($_GET['id'])) {
        // Obtener una sola noticia
        $stmt = $conn->prepare("SELECT id, titulo, fecha, url, imagen FROM noticias WHERE id = ?");
        $stmt->bind_param("i", $_GET['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $noticia = $result->fetch_assoc();
        if ($noticia) {
            $noticia['imagen_url'] = $uploadWebDir . $noticia['imagen'];
            echo json_encode($noticia);
        } else {
            echo json_encode(null);
        }
        $stmt->close();
    } else {
        // Obtener todas las noticias
        $result = $conn->query("SELECT id, titulo, fecha, url, imagen FROM noticias ORDER BY fecha DESC");
        $noticias = [];
        while ($row = $result->fetch_assoc()) {
            $row['imagen_url'] = $uploadWebDir . $row['imagen'];
            $noticias[] = $row;
        }
        echo json_encode($noticias);
    }
    $conn->close();
    exit;
}

// --- Lógica para MODIFICAR noticias (requiere sesión) ---
if (!$is_allowed) {
    $response['message'] = 'Acceso denegado. No tienes permisos para realizar esta acción.';
    echo json_encode($response);
    exit;
}

if ($method === 'POST') {
    // --- ELIMINAR ---
    if (isset($_POST['action']) && $_POST['action'] === 'delete') {
        $id = $_POST['id'];
        // Primero, obtener el nombre de la imagen para borrar el archivo
        $stmt = $conn->prepare("SELECT imagen FROM noticias WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            $imagen_a_borrar = $uploadServerDir . $row['imagen'];
            if (file_exists($imagen_a_borrar) && is_file($imagen_a_borrar)) {
                unlink($imagen_a_borrar);
            }
        }
        $stmt->close();

        // Ahora, borrar el registro de la DB
        $stmt = $conn->prepare("DELETE FROM noticias WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'Noticia eliminada con éxito.'];
        } else {
            $response['message'] = 'Error al eliminar la noticia de la base de datos.';
        }
        $stmt->close();
    }
    // --- CREAR / ACTUALIZAR ---
    else {
        $titulo = $_POST['titulo'];
        $fecha = $_POST['fecha'];
        $url = $_POST['url'];
        $id = $_POST['id'] ?? null;
        $imagen_nombre = '';

        // Manejo de la subida de imagen
        if (isset($_FILES['imagen'])) {
            $file = $_FILES['imagen'];
            if ($file['error'] === UPLOAD_ERR_OK) {
                $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                $imagen_nombre = uniqid('noticia_') . '.' . $ext;
                move_uploaded_file($file['tmp_name'], $uploadServerDir . $imagen_nombre);
            }
        }

        if ($id) { // Actualizar
            if ($imagen_nombre) { // Si se subió una nueva imagen
                $stmt = $conn->prepare("UPDATE noticias SET titulo = ?, fecha = ?, url = ?, imagen = ? WHERE id = ?");
                $stmt->bind_param("ssssi", $titulo, $fecha, $url, $imagen_nombre, $id);
            } else { // Si no se subió imagen, no se actualiza ese campo
                $stmt = $conn->prepare("UPDATE noticias SET titulo = ?, fecha = ?, url = ? WHERE id = ?");
                $stmt->bind_param("sssi", $titulo, $fecha, $url, $id);
            }
            $message = 'Noticia actualizada con éxito.';
        } else { // Crear
            $stmt = $conn->prepare("INSERT INTO noticias (titulo, fecha, url, imagen) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $titulo, $fecha, $url, $imagen_nombre);
            $message = 'Noticia creada con éxito.';
        }

        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => $message];
        } else {
            $response['message'] = 'Error al guardar en la base de datos.';
        }
        $stmt->close();
    }
}

echo json_encode($response);
$conn->close();
?>
