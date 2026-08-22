<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You do not have permission to do this.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');
$position = trim($input['position'] ?? '');
$role = $input['role'] ?? '';
$password = $input['password'] ?? '';

$validRoles = ['pba', 'cfo', 'coo', 'accountant', 'admin'];

if (empty($name) || empty($email) || empty($phone) || empty($position) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

if (!in_array($role, $validRoles)) {
    echo json_encode(['success' => false, 'message' => 'Invalid role selected.']);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']);
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

// Privileged accounts created by Admin are active immediately, already "verified" — no OTP step needed
$stmt = $pdo->prepare('INSERT INTO users (name, username, email, password, phone, position, role, email_verified, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([$name, $username, $email, $hashedPassword, $phone, $position, $role, true, 'active']);

$newUserId = $pdo->lastInsertId();

$auditStmt = $pdo->prepare('INSERT INTO audit_logs (user_id, action, description) VALUES (?, ?, ?)');
$auditStmt->execute([$_SESSION['user_id'], 'create_privileged_account', "Created $role account for $email"]);

echo json_encode(['success' => true, 'message' => 'Account created successfully.']);