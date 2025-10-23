<?php
session_start();
header('Content-Type: application/json');
require_once 'conn.php';

$response = ['success' => false, 'message' => 'Acción no válida.'];

// --- Verificación de permisos ---
$is_allowed = (isset($_SESSION['user_logged_in']) && ($_SESSION['user_role'] === 'noticias' || $_SESSION['user_role'] === 'admin_total'));

// --- Rutas para las imágenes ---
$uploadServerDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'noticias' . DIRECTORY_SEPARATOR;
$uploadWebDir = 'sources/uploads/noticias/';

// Crear directorio si no existe
if (!is_dir($uploadServerDir)) {
    mkdir($uploadServerDir, 0777, true);
}

// Verificar permisos de escritura en el directorio
if (!is_writable($uploadServerDir)) {
    $response['message'] = 'Error: El directorio de subida de imágenes no tiene permisos de escritura. Verifique los permisos.';
    echo json_encode($response);
    exit;
}


$action = $_REQUEST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// --- Lógica para OBTENER noticias (público) ---
if ($method === 'GET' && ($action === 'get' || empty($action))) {
    if (isset($_GET['id'])) {
        // Obtener una sola noticia
        $stmt = $conn->prepare("SELECT id, titulo, fecha, url, imagen FROM noticias WHERE id = ?");
        if (!$stmt) {
            $response['message'] = 'Error al preparar la consulta GET individual: ' . $conn->error;
            echo json_encode($response);
            $conn->close();
            exit;
        }
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
        if (!$result) {
            $response['message'] = 'Error al ejecutar la consulta GET todas: ' . $conn->error;
            echo json_encode($response);
            $conn->close();
            exit;
        }
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
        if (!$stmt) {
            $response['message'] = 'Error al preparar la consulta DELETE (obtener imagen): ' . $conn->error;
            echo json_encode($response);
            $conn->close();
            exit;
        }
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            $imagen_a_borrar = $uploadServerDir . $row['imagen'];
            if (file_exists($imagen_a_borrar) && is_file($imagen_a_borrar)) {
                if (!unlink($imagen_a_borrar)) {
                    error_log("Failed to delete image file: " . $imagen_a_borrar);
                }
            }
        }
        $stmt->close();

        // Ahora, borrar el registro de la DB
        $stmt = $conn->prepare("DELETE FROM noticias WHERE id = ?");
        if (!$stmt) {
            $response['message'] = 'Error al preparar la consulta DELETE (DB): ' . $conn->error;
            echo json_encode($response);
            $conn->close();
            exit;
        }
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'Noticia eliminada con éxito.'];
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
                if (!move_uploaded_file($file['tmp_name'], $uploadServerDir . $imagen_nombre)) {
                    $response['message'] = 'Error al mover el archivo de imagen subido. Verifique los permisos del directorio: ' . $uploadServerDir;
                    echo json_encode($response);
                    $conn->close();
                    exit;
                }
            } else if ($file['error'] !== UPLOAD_ERR_NO_FILE) { // Only report if it's an actual error, not just no file
                $upload_errors = [
                    UPLOAD_ERR_INI_SIZE   => 'El archivo excede el tamaño máximo permitido por el servidor.',
                    UPLOAD_ERR_FORM_SIZE  => 'El archivo excede el tamaño máximo permitido en el formulario.',
                    UPLOAD_ERR_PARTIAL    => 'El archivo fue subido solo parcialmente.',
                    UPLOAD_ERR_NO_TMP_DIR => 'Falta una carpeta temporal.',
                    UPLOAD_ERR_CANT_WRITE => 'Fallo al escribir el archivo en el disco.',
                    UPLOAD_ERR_EXTENSION  => 'Una extensión de PHP detuvo la subida del archivo.',
                ];
                $response['message'] = $upload_errors[$file['error']] ?? 'Error desconocido al subir la imagen.';
                echo json_encode($response);
                $conn->close();
                exit;
            }
        }

        if ($id) { // Actualizar
            if ($imagen_nombre) { // Si se subió una nueva imagen
                // Borrar la imagen antigua si existe
                $stmt_old_img = $conn->prepare("SELECT imagen FROM noticias WHERE id = ?");
                if ($stmt_old_img) {
                    $stmt_old_img->bind_param("i", $id);
                    $stmt_old_img->execute();
                    $result_old_img = $stmt_old_img->get_result();
                    if ($row_old_img = $result_old_img->fetch_assoc()) {
                        $old_image_path = $uploadServerDir . $row_old_img['imagen'];
                        if (file_exists($old_image_path) && is_file($old_image_path)) {
                            if (!unlink($old_image_path)) {
                                error_log("Failed to delete old image file: " . $old_image_path);
                            }
                        }
                    }
                    $stmt_old_img->close();
                }

                $stmt = $conn->prepare("UPDATE noticias SET titulo = ?, fecha = ?, url = ?, imagen = ? WHERE id = ?");
                if (!$stmt) {
                    $response['message'] = 'Error al preparar la consulta UPDATE con imagen: ' . $conn->error;
                    echo json_encode($response);
                    $conn->close();
                    exit;
                }
                $stmt->bind_param("ssssi", $titulo, $fecha, $url, $imagen_nombre, $id);
            } else { // Si no se subió imagen, no se actualiza ese campo
                $stmt = $conn->prepare("UPDATE noticias SET titulo = ?, fecha = ?, url = ? WHERE id = ?");
                if (!$stmt) {
                    $response['message'] = 'Error al preparar la consulta UPDATE sin imagen: ' . $conn->error;
                    echo json_encode($response);
                    $conn->close();
                    exit;
                }
                $stmt->bind_param("sssi", $titulo, $fecha, $url, $id);
            }
            $message = 'Noticia actualizada con éxito.';
        } else { // Crear
            // Para crear, la imagen es obligatoria (validación JS ya lo hace, pero PHP debe ser robusto)
            if (empty($imagen_nombre)) {
                $response['message'] = 'Error: La imagen es obligatoria para crear una nueva noticia.';
                echo json_encode($response);
                $conn->close();
                exit;
            }
            $stmt = $conn->prepare("INSERT INTO noticias (titulo, fecha, url, imagen) VALUES (?, ?, ?, ?)");
            if (!$stmt) {
                $response['message'] = 'Error al preparar la consulta INSERT: ' . $conn->error;
                echo json_encode($response);
                $conn->close();
                exit;
            }
            $stmt->bind_param("ssss", $titulo, $fecha, $url, $imagen_nombre);
            $message = 'Noticia creada con éxito.';
        }

        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => $message];
        } else {
            $response['message'] = 'Error al guardar en la base de datos: ' . $stmt->error;
        }
        $stmt->close();
    }
}

echo json_encode($response);
$conn->close();
?>
