<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

$requestId = $_GET['id'] ?? null;

if (!$requestId || !is_numeric($requestId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request ID.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
$stmt->execute([$requestId]);
$request = $stmt->fetch();

if (!$request) {
    echo json_encode(['success' => false, 'message' => 'Request not found.']);
    exit;
}

// Security check: only the requester who owns this, or an approver/admin role, should see it.
// For now (Requester module), we only allow the owner.
if ($request['requester_id'] != $_SESSION['user_id']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You do not have permission to view this request.']);
    exit;
}

$approvalsStmt = $pdo->prepare('
    SELECT approvals.*, users.name as approver_name 
    FROM approvals 
    JOIN users ON approvals.approver_id = users.id 
    WHERE approvals.request_id = ? 
    ORDER BY approvals.created_at ASC
');
$approvalsStmt->execute([$requestId]);
$approvals = $approvalsStmt->fetchAll();

$attachmentsStmt = $pdo->prepare('SELECT * FROM request_attachments WHERE request_id = ?');
$attachmentsStmt->execute([$requestId]);
$attachments = $attachmentsStmt->fetchAll();

$paymentStmt = $pdo->prepare('SELECT * FROM payments WHERE request_id = ?');
$paymentStmt->execute([$requestId]);
$payment = $paymentStmt->fetch();

echo json_encode([
    'success' => true,
    'request' => $request,
    'approvals' => $approvals,
    'attachments' => $attachments,
    'payment' => $payment ?: null
]);