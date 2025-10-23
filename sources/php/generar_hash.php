<?php
/**
 * Script seguro para generar un hash de contraseña (PASSWORD_DEFAULT / Bcrypt/Argon2).
 * La contraseña ingresada NO se almacena en el código ni en el servidor.
 */

$hash_generado = null;
$password_plana = null;

// 1. Procesa la solicitud POST (el envío del formulario)
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Verifica y sanitiza la entrada
    if (!empty($_POST['passwordPlana'])) {
        
        $password_plana = trim($_POST['passwordPlana']);
        
        // 2. Genera el hash de forma segura
        // La función password_hash() es el estándar de oro en PHP.
        $hash_generado = password_hash($password_plana, PASSWORD_DEFAULT);
        
        // **IMPORTANTE**: Una vez que el hash se ha generado y almacenado en $hash_generado,
        // la variable $password_plana y los datos del $_POST se eliminarán de la memoria
        // del servidor cuando el script termine, garantizando que la contraseña plana
        // no quede almacenada.
        
        // 3. (Opcional) Borra el valor de la variable de la memoria inmediatamente
        // Esto es una medida de precaución, ya que PHP la limpia automáticamente al final.
        unset($password_plana); 

    } else {
        $error_mensaje = "❌ Por favor, ingresa una contraseña válida para hashear.";
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Generador de Hash Seguro</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="password"] { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #007bff; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background-color: #0056b3; }
        .hash-result { background-color: #e9ecef; border: 1px solid #ced4da; padding: 15px; border-radius: 4px; margin-top: 20px; word-wrap: break-word; }
        .hash-value { font-size: 1.2em; font-weight: bold; color: #d9534f; }
        .alert { background-color: #fcf8e3; border: 1px solid #faebcd; color: #8a6d3b; padding: 10px; border-radius: 4px; margin-top: 15px; }
        .error { background-color: #f2dede; border: 1px solid #ebccd1; color: #a94442; padding: 10px; border-radius: 4px; margin-top: 15px; }
    </style>
</head>
<body>

<div class="container">
    <h1>Generador de Hash Seguro de Contraseña</h1>

    <?php
    // Muestra el mensaje de error si aplica
    if (isset($error_mensaje)) {
        echo "<div class='error'>{$error_mensaje}</div>";
    }

    // Muestra el hash si se generó
    if (!empty($hash_generado)) {
        echo "<div class='hash-result'>";
        echo "<h2>✅ Hash Generado con Éxito</h2>";
        // NO mostramos la contraseña plana aquí por seguridad, solo el resultado.
        echo "<p>El hash generado es:</p>";
        echo "<p class='hash-value'>" . htmlspecialchars($hash_generado) . "</p>";
        echo "<p class='alert'><strong>Instrucción:</strong> Copia y pega este hash completo en el campo de contraseña de tu base de datos.</p>";
        echo "</div>";
    }
    ?>

    <form method="POST" action="">
        <div class="form-group">
            <label for="passwordPlana">Ingresa la contraseña a hashear (NO se guarda):</label>
            <input type="password" id="passwordPlana" name="passwordPlana" required autocomplete="off"> 
        </div>
        <button type="submit">Generar Hash</button>
    </form>

</div>
</body>
</html>