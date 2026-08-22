<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$email = trim($input['email'] ?? '');
$otp = trim($input['otp'] ?? '');
$newPassword = $input['newPassword'] ?? '';

if (empty($email) || empty($otp) || empty($newPassword)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if (strlen($newPassword) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']);
    exit;
}

if (!isset($_SESSION['reset_otp'], $_SESSION['reset_email']) || $_SESSION['reset_email'] !== $email) {
    echo json_encode(['success' => false, 'message' => 'Reset session expired. Please try again.']);
    exit;
}

if (time() > $_SESSION['reset_otp_expires']) {
    echo json_encode(['success' => false, 'message' => 'Code expired. Please request a new one.']);
    exit;
}

if ($otp !== $_SESSION['reset_otp']) {
    echo json_encode(['success' => false, 'message' => 'Incorrect code.']);
    exit;
}

$hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

$stmt = $pdo->prepare('UPDATE users SET password = ? WHERE email = ?');
$stmt->execute([$hashedPassword, $email]);

unset($_SESSION['reset_otp'], $_SESSION['reset_otp_expires'], $_SESSION['reset_email']);

echo json_encode(['success' => true]);