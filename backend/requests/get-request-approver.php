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
$role = $_SESSION['role'];

if (!$requestId || !is_numeric($requestId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request ID.']);
    exit;
}

$stmt = $pdo->prepare('
    SELECT requests.*, users.name as requester_name 
    FROM requests 
    JOIN users ON requests.requester_id = users.id 
    WHERE requests.id = ?
');
$stmt->execute([$requestId]);
$request = $stmt->fetch();

if (!$request) {
    echo json_encode(['success' => false, 'message' => 'Request not found.']);
    exit;
}

// Only PBA, CFO, COO (approver roles) can view via this endpoint
$approverRoles = ['pba', 'cfo', 'coo', 'accountant'];
if (!in_array($role, $approverRoles)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You do not have permission to view this.']);
    exit;
}

// Determine if THIS role can act on THIS request right now
$statusMap = ['pba' => 'pending_pba', 'cfo' => 'pending_cfo', 'coo' => 'pending_coo'];
$canAct = isset($statusMap[$role]) && ($statusMap[$role] === $request['status']);

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

$proofStmt = $pdo->prepare('
    SELECT proof_of_usage.*, users.name as uploader_name 
    FROM proof_of_usage 
    JOIN users ON proof_of_usage.uploaded_by = users.id 
    WHERE proof_of_usage.request_id = ? 
    ORDER BY proof_of_usage.created_at DESC
');
$proofStmt->execute([$requestId]);
$proofOfUsage = $proofStmt->fetchAll();

echo json_encode([
    'success' => true,
    'request' => $request,
    'approvals' => $approvals,
    'attachments' => $attachments,
    'can_act' => $canAct,
    'payment' => $payment ?: null,
    'proof_of_usage' => $proofOfUsage
]);