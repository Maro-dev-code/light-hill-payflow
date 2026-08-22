<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

if ($_SESSION['role'] !== 'accountant') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You do not have permission to view this.']);
    exit;
}

$accountantId = $_SESSION['user_id'];

$stmt = $pdo->prepare('
    SELECT payments.*, requests.request_id, requests.subject, users.name as requester_name
    FROM payments
    JOIN requests ON payments.request_id = requests.id
    JOIN users ON requests.requester_id = users.id
    WHERE payments.accountant_id = ?
    ORDER BY payments.created_at DESC
');
$stmt->execute([$accountantId]);
$payments = $stmt->fetchAll();

echo json_encode(['success' => true, 'payments' => $payments]);