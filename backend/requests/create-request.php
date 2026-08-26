<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

$userId = $_SESSION['user_id'];

$subject = trim($_POST['subject'] ?? '');
$sbu = trim($_POST['sbu'] ?? '');
$amount = trim($_POST['amount'] ?? '');
$description = trim($_POST['description'] ?? '');
$bankName = trim($_POST['bank_name'] ?? '');
$accountNumber = trim($_POST['account_number'] ?? '');
$accountName = trim($_POST['account_name'] ?? '');

if (empty($sbu) || empty($bankName) || empty($accountNumber) || empty($accountName)) {
    echo json_encode(['success' => false, 'message' => 'SBU and bank details are required.']);
    exit;
}

if (empty($subject) || empty($amount) || empty($description)) {
    echo json_encode(['success' => false, 'message' => 'Subject, amount, and description are required.']);
    exit;
}

if (!is_numeric($amount) || $amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Amount must be a valid positive number.']);
    exit;
}

// Generate a human-readable unique request ID, e.g. LH-2026-0001
$year = date('Y');
$countStmt = $pdo->query("SELECT COUNT(*) as total FROM requests WHERE YEAR(created_at) = $year");
$count = $countStmt->fetch()['total'] + 1;
$requestId = 'LH-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

$stmt = $pdo->prepare('INSERT INTO requests (request_id, requester_id, subject, sbu, amount, description, bank_name, account_number, account_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([$requestId, $userId, $subject, $sbu, $amount, $description, $bankName, $accountNumber, $accountName, 'pending_pba']);
$newRequestDbId = $pdo->lastInsertId();

// Handle file uploads, if any were sent
if (!empty($_FILES['attachments']['name'][0])) {
    $uploadDir = '../uploads/requests/';

    foreach ($_FILES['attachments']['name'] as $index => $originalName) {
        $tmpPath = $_FILES['attachments']['tmp_name'][$index];
        $fileSize = $_FILES['attachments']['size'][$index];
        $fileType = $_FILES['attachments']['type'][$index];

        $safeName = time() . '_' . $index . '_' . preg_replace('/[^A-Za-z0-9._-]/', '', $originalName);
        $destination = $uploadDir . $safeName;

        if (move_uploaded_file($tmpPath, $destination)) {
            $attStmt = $pdo->prepare('INSERT INTO request_attachments (request_id, uploaded_by, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)');
            $attStmt->execute([$newRequestDbId, $userId, $originalName, $safeName, $fileType, $fileSize]);
        }
    }
}

echo json_encode(['success' => true, 'request_id' => $requestId]);