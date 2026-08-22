<?php
session_start();
require_once '../config/database.php';
require_once '../config/mailer.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');
$position = trim($input['position'] ?? '');
$password = $input['password'] ?? '';
$confirmPassword = $input['confirmPassword'] ?? '';

if (empty($name) || empty($email) || empty($phone) || empty($position) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']);
    exit;
}

if ($password !== $confirmPassword) {
    echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
    exit;
}

$check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$check->execute([$email]);
if ($check->fetch()) {
    echo json_encode(['success' => false, 'message' => 'An account with this email already exists.']);
    exit;
}

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);
$username = strtolower(explode('@', $email)[0]);

$otp = strval(random_int(100000, 999999));

$_SESSION['pending_email'] = $email;
$_SESSION['otp'] = $otp;
$_SESSION['otp_expires'] = time() + 600;

$stmt = $pdo->prepare('INSERT INTO users (name, username, email, password, phone, position, role, email_verified, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([$name, $username, $email, $hashedPassword, $phone, $position, 'requester', false, 'pending']);

$emailSent = sendOTPEmail($email, $name, $otp);

if (!$emailSent) {
    echo json_encode(['success' => false, 'message' => 'Account created, but we couldn\'t send the verification email. Please try resending the code.']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Account created. Check your email for the OTP.']);