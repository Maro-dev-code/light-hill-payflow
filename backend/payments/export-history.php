<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die('Not authenticated.');
}

if ($_SESSION['role'] !== 'accountant') {
    http_response_code(403);
    die('You do not have permission to do this.');
}

$accountantId = $_SESSION['user_id'];
$fromDate = $_GET['from'] ?? null;
$toDate = $_GET['to'] ?? null;

$query = '
    SELECT requests.sbu, requests.bank_name, requests.account_number, requests.account_name, 
           requests.description, users.name as requester_name, payments.amount_paid, payments.payment_date
    FROM payments
    JOIN requests ON payments.request_id = requests.id
    JOIN users ON requests.requester_id = users.id
    WHERE payments.accountant_id = ?
';
$params = [$accountantId];

if ($fromDate) {
    $query .= ' AND payments.payment_date >= ?';
    $params[] = $fromDate;
}
if ($toDate) {
    $query .= ' AND payments.payment_date <= ?';
    $params[] = $toDate;
}

$query .= ' ORDER BY payments.payment_date ASC';

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$payments = $stmt->fetchAll();

$filename = 'payment_history_' . date('Y-m-d') . '.csv';
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="' . $filename . '"');

$output = fopen('php://output', 'w');
fputcsv($output, ['Requester Name', 'SBU', 'Bank Name', 'Account Number', 'Account Name', 'Amount', 'Description']);

$total = 0;
foreach ($payments as $p) {
    fputcsv($output, [
        $p['requester_name'],
        $p['sbu'],
        $p['bank_name'],
        $p['account_number'],
        $p['account_name'],
        $p['amount_paid'],
        $p['description']
    ]);
    $total += $p['amount_paid'];
}

fputcsv($output, []);
fputcsv($output, ['', '', '', '', 'TOTAL:', $total, '']);
fclose($output);