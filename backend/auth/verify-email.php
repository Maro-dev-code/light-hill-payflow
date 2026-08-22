<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$otp = trim($input['otp'] ?? '');

if (empty($otp) || !isset($_SESSION['otp'], $_SESSION['pending_email'])) {
    echo json_encode(['success' => false, 'message' => 'Verification session expired. Please register again.']);
    exit;
}

if (time() > $_SESSION['otp_expires']) {
    echo json_encode(['success' => false, 'message' => 'Code expired. Please register again.']);
    exit;
}

if ($otp !== $_SESSION['otp']) {
    echo json_encode(['success' => false, 'message' => 'Incorrect code.']);
    exit;
}

$stmt = $pdo->prepare('UPDATE users SET email_verified = 1 WHERE email = ?');
$stmt->execute([$_SESSION['pending_email']]);

unset($_SESSION['otp'], $_SESSION['otp_expires'], $_SESSION['pending_email']);

echo json_encode(['success' => true]);