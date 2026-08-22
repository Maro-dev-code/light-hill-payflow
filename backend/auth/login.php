<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

// Basic presence check
if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

// Validate the email is actually shaped like an email before touching the database
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
    exit;
}

if ($user['account_status'] !== 'active') {
    echo json_encode(['success' => false, 'message' => 'Your account is not yet active. Contact your administrator.']);
    exit;
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['role'] = $user['role'];
$_SESSION['name'] = $user['name'];

$redirects = [
    'requester'  => '/light-hill-payflow/frontend/pages/requester/dashboard.html',
    'pba'        => '/light-hill-payflow/frontend/pages/approver/dashboard.html',
    'cfo'        => '/light-hill-payflow/frontend/pages/approver/dashboard.html',
    'coo'        => '/light-hill-payflow/frontend/pages/approver/dashboard.html',
    'accountant' => '/light-hill-payflow/frontend/pages/accountant/dashboard.html',
    'admin'      => '/light-hill-payflow/frontend/pages/admin/dashboard.html',
];

echo json_encode([
    'success' => true,
    'redirect' => $redirects[$user['role']]
]);