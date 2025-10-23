<?php
header('Content-Type: application/json');
require_once 'conn.php';

$response = ['success' => false, 'message' => 'Petición no válida.'];

// 1. Leer los datos JSON enviados desde el frontend
$data = json_decode(file_get_contents('php://input'), true);

if ($data && isset($data['username']) && isset($data['password'])) {
    $username = $data['username']; // En este caso, el correo electrónico
    $password = $data['password'];

    // Nueva validación: Asegurarse de que el username es un email válido
    if (!filter_var($username, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Por favor, introduce una dirección de correo electrónico válida.';
        echo json_encode($response);
        exit();
    }
    // 2. Validar el dominio del correo electrónico
    $allowed_domains = ['@alumnos.ceat.cl', '@ceat.cl'];
    $is_allowed = false;
    foreach ($allowed_domains as $domain) {
        // str_ends_with es una función de PHP 8, más moderna y segura
        if (str_ends_with(strtolower($username), strtolower($domain))) {
            $is_allowed = true;
            break;
        }
    }

    if (!$is_allowed) {
        $response['message'] = 'El correo electrónico no pertenece a un dominio permitido.';
    } else {
        // 3. Verificar si el usuario ya existe
        $stmt_check = $conn->prepare("SELECT id FROM usuarios WHERE username = ?");
        if ($stmt_check) {
            $stmt_check->bind_param("s", $username);
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();

            if ($result_check->num_rows > 0) {
                $response['message'] = 'Este correo electrónico ya está registrado.';
            } else {
                // 4. Validar la fortaleza de la contraseña (mínimo 8 caracteres)
                if (strlen($password) < 8) {
                    $response['message'] = 'La contraseña debe tener al menos 8 caracteres.';
                } else {
                    // 5. Encriptar la contraseña
                    $password_hash = password_hash($password, PASSWORD_DEFAULT);

                    // 6. Insertar el nuevo usuario en la base de datos
                    // Por defecto, asignamos el rol 'cronograma'. Esto se puede cambiar si es necesario.
                    $default_role = 'cronograma';
                    $stmt_insert = $conn->prepare("INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)");
                    if ($stmt_insert) {
                        $stmt_insert->bind_param("sss", $username, $password_hash, $default_role);
                        if ($stmt_insert->execute()) {
                            $response['success'] = true;
                            $response['message'] = '¡Registro exitoso! Ahora puedes iniciar sesión.';
                        } else {
                            $response['message'] = 'Error al registrar el usuario.';
                        }
                        $stmt_insert->close();
                    } else {
                        $response['message'] = 'Error en la preparación de la consulta de inserción.';
                    }
                }
            }
            $stmt_check->close();
        } else {
            $response['message'] = 'Error en la preparación de la consulta de verificación.';
        }
    }
}

$conn->close();
echo json_encode($response);
?>