<?php
session_start();
require_once '../config/database.php';
require_once '../config/mailer.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, name FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    $otp = strval(random_int(100000, 999999));

    $_SESSION['reset_email'] = $email;
    $_SESSION['reset_otp'] = $otp;
    $_SESSION['reset_otp_expires'] = time() + 600;

    sendOTPEmail($email, $user['name'], $otp);
}

// Always the same response, whether or not the email exists — prevents email enumeration
echo json_encode(['success' => true, 'message' => 'If this email exists, a reset code has been sent.']);