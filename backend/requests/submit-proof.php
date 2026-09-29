<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

$requestId = $_POST['request_id'] ?? null;
$comment = trim($_POST['comment'] ?? '');

if (!$requestId || !is_numeric($requestId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

if (empty($comment)) {
    echo json_encode(['success' => false, 'message' => 'A comment describing the document is required.']);
    exit;
}

if (empty($_FILES['document']['name'])) {
    echo json_encode(['success' => false, 'message' => 'A document file is required.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
$stmt->execute([$requestId]);
$request = $stmt->fetch();

if (!$request) {
    echo json_encode(['success' => false, 'message' => 'Request not found.']);
    exit;
}

if ($request['requester_id'] != $_SESSION['user_id']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Only the original requester can submit proof of usage.']);
    exit;
}

if ($request['status'] !== 'paid') {
    echo json_encode(['success' => false, 'message' => 'Proof of usage can only be submitted once the request has been paid.']);
    exit;
}

$uploadDir = '../uploads/proof-of-usage/';
$originalName = $_FILES['document']['name'];
$tmpPath = $_FILES['document']['tmp_name'];
$safeName = time() . '_' . preg_replace('/[^A-Za-z0-9._-]/', '', $originalName);
$destination = $uploadDir . $safeName;

if (!move_uploaded_file($tmpPath, $destination)) {
    echo json_encode(['success' => false, 'message' => 'Failed to upload document.']);
    exit;
}

$insertStmt = $pdo->prepare('INSERT INTO proof_of_usage (request_id, uploaded_by, file_name, file_path, comment) VALUES (?, ?, ?, ?, ?)');
$insertStmt->execute([$requestId, $_SESSION['user_id'], $originalName, $safeName, $comment]);

$auditStmt = $pdo->prepare('INSERT INTO audit_logs (user_id, request_id, action, description) VALUES (?, ?, ?, ?)');
$auditStmt->execute([$_SESSION['user_id'], $requestId, 'submit_proof_of_usage', "Submitted proof of usage: $originalName"]);

echo json_encode(['success' => true, 'message' => 'Proof of usage submitted successfully.']);