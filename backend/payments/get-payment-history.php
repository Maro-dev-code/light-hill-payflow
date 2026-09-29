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

$stmt = $pdo->prepare('
   SELECT payments.*, requests.request_id, requests.subject, requests.sbu, requests.description,
       requests.bank_name, requests.account_number, requests.account_name,
       requester.name as requester_name, accountant.name as accountant_name
    FROM payments
    JOIN requests ON payments.request_id = requests.id
    JOIN users AS requester ON requests.requester_id = requester.id
    JOIN users AS accountant ON payments.accountant_id = accountant.id
    ORDER BY payments.created_at DESC
');
$stmt->execute();
$payments = $stmt->fetchAll();

echo json_encode(['success' => true, 'payments' => $payments]);