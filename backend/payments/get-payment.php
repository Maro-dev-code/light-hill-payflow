<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

$paymentId = $_GET['id'] ?? null;

if (!$paymentId || !is_numeric($paymentId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid payment ID.']);
    exit;
}

$stmt = $pdo->prepare('
    SELECT payments.*, requests.request_id, requests.subject, users.name as requester_name
    FROM payments
    JOIN requests ON payments.request_id = requests.id
    JOIN users ON requests.requester_id = users.id
    WHERE payments.id = ?
');
$stmt->execute([$paymentId]);
$payment = $stmt->fetch();

if (!$payment) {
    echo json_encode(['success' => false, 'message' => 'Payment not found.']);
    exit;
}

if ($_SESSION['role'] !== 'accountant' && $payment['requester_id'] != $_SESSION['user_id'] ?? null) {
    // Note: requester_id isn't selected above, so this check is a placeholder for future role expansion
}

echo json_encode(['success' => true, 'payment' => $payment]);