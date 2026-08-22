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
    echo json_encode(['success' => false, 'message' => 'You do not have permission to record payments.']);
    exit;
}

$accountantId = $_SESSION['user_id'];

$requestId = $_POST['request_id'] ?? null;
$amountPaid = $_POST['amount_paid'] ?? null;
$paymentDate = $_POST['payment_date'] ?? null;
$paymentReference = trim($_POST['payment_reference'] ?? '');

if (!$requestId || !is_numeric($requestId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

if (empty($amountPaid) || !is_numeric($amountPaid) || $amountPaid <= 0) {
    echo json_encode(['success' => false, 'message' => 'A valid payment amount is required.']);
    exit;
}

if (empty($paymentDate)) {
    echo json_encode(['success' => false, 'message' => 'Payment date is required.']);
    exit;
}

if (empty($_FILES['proof_file']['name'])) {
    echo json_encode(['success' => false, 'message' => 'Proof of payment is required.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
$stmt->execute([$requestId]);
$request = $stmt->fetch();

if (!$request) {
    echo json_encode(['success' => false, 'message' => 'Request not found.']);
    exit;
}

if ($request['status'] !== 'approved') {
    echo json_encode(['success' => false, 'message' => 'This request is not ready for payment.']);
    exit;
}

// Double-check no payment already exists for this request (belt-and-braces alongside the DB's UNIQUE constraint)
$existingPayment = $pdo->prepare('SELECT id FROM payments WHERE request_id = ?');
$existingPayment->execute([$requestId]);
if ($existingPayment->fetch()) {
    echo json_encode(['success' => false, 'message' => 'This request has already been paid.']);
    exit;
}

// Handle the proof-of-payment file upload
$uploadDir = '../uploads/payments/';
$originalName = $_FILES['proof_file']['name'];
$tmpPath = $_FILES['proof_file']['tmp_name'];
$safeName = time() . '_' . preg_replace('/[^A-Za-z0-9._-]/', '', $originalName);
$destination = $uploadDir . $safeName;

if (!move_uploaded_file($tmpPath, $destination)) {
    echo json_encode(['success' => false, 'message' => 'Failed to upload proof of payment.']);
    exit;
}

try {
    $pdo->beginTransaction();

    $paymentStmt = $pdo->prepare('INSERT INTO payments (request_id, accountant_id, amount_paid, payment_date, payment_reference, proof_file) VALUES (?, ?, ?, ?, ?, ?)');
    $paymentStmt->execute([$requestId, $accountantId, $amountPaid, $paymentDate, $paymentReference ?: null, $safeName]);

    $updateStmt = $pdo->prepare("UPDATE requests SET status = 'paid' WHERE id = ?");
    $updateStmt->execute([$requestId]);

    $auditStmt = $pdo->prepare('INSERT INTO audit_logs (user_id, request_id, action, description) VALUES (?, ?, ?, ?)');
    $auditStmt->execute([$accountantId, $requestId, 'record_payment', "Recorded payment of ₦" . number_format($amountPaid, 2)]);

    $pdo->commit();

    $notifStmt = $pdo->prepare('INSERT INTO notifications (user_id, request_id, title, message) VALUES (?, ?, ?, ?)');
$notifStmt->execute([
    $request['requester_id'],
    $requestId,
    'Payment Received',
    "Payment of ₦" . number_format($amountPaid, 2) . " has been recorded for your request \"{$request['subject']}\"."
]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Payment could not be recorded. Please try again.']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Payment recorded successfully.']);