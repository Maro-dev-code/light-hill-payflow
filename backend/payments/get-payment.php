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
    SELECT 
        payments.id as payment_id,
        payments.request_id,
        payments.amount_paid,
        payments.payment_date,
        payments.payment_reference,
        payments.proof_file,
        payments.created_at,
        requests.request_id as display_request_id,
        requests.subject,
        requests.sbu,
        requests.description,
        requests.bank_name,
        requests.account_number,
        requests.account_name,
        requester.name as requester_name,
        accountant.name as accountant_name
    FROM payments
    JOIN requests ON payments.request_id = requests.id
    JOIN users AS requester ON requests.requester_id = requester.id
    JOIN users AS accountant ON payments.accountant_id = accountant.id
    WHERE payments.id = ?
');
$stmt->execute([$paymentId]);
$payment = $stmt->fetch();

if (!$payment) {
    echo json_encode(['success' => false, 'message' => 'Payment not found.']);
    exit;
}

$approvalsStmt = $pdo->prepare('
    SELECT approvals.*, users.name as approver_name
    FROM approvals
    JOIN users ON approvals.approver_id = users.id
    WHERE approvals.request_id = ?
    ORDER BY approvals.created_at ASC
');
$approvalsStmt->execute([$payment['request_id']]);
$approvals = $approvalsStmt->fetchAll();

$attachmentsStmt = $pdo->prepare('SELECT * FROM request_attachments WHERE request_id = ?');
$attachmentsStmt->execute([$payment['request_id']]);
$attachments = $attachmentsStmt->fetchAll();

$proofStmt = $pdo->prepare('
    SELECT proof_of_usage.*, users.name as uploader_name 
    FROM proof_of_usage 
    JOIN users ON proof_of_usage.uploaded_by = users.id 
    WHERE proof_of_usage.request_id = ? 
    ORDER BY proof_of_usage.created_at DESC
');
$proofStmt->execute([$payment['request_id']]);
$proofOfUsage = $proofStmt->fetchAll();

echo json_encode([
    'success' => true,
    'payment' => $payment,
    'approvals' => $approvals,
    'attachments' => $attachments,
    'proof_of_usage' => $proofOfUsage
]);