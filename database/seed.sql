USE light_hill_payflow;

INSERT INTO users (name, username, email, password, phone, position, role, email_verified, account_status) VALUES
('Royal Requester', 'royal.requester', 'requester@lighthill.test', '$2b$10$8B/DT.W3JE4IrPVSU3IWqOHGR7.76i6LW2fWdywOEKzk94TLqWCQW', '08010000001', 'Marketing Officer', 'requester', TRUE, 'active'),
('Amaka PBA', 'amaka.pba', 'pba@lighthill.test', '$2b$10$8B/DT.W3JE4IrPVSU3IWqOHGR7.76i6LW2fWdywOEKzk94TLqWCQW', '08010000002', 'Budget Analyst', 'pba', TRUE, 'active'),
('Chidi CFO', 'chidi.cfo', 'cfo@lighthill.test', '$2b$10$8B/DT.W3JE4IrPVSU3IWqOHGR7.76i6LW2fWdywOEKzk94TLqWCQW', '08010000003', 'Chief Financial Officer', 'cfo', TRUE, 'active'),
('Ngozi COO', 'ngozi.coo', 'coo@lighthill.test', '$2b$10$8B/DT.W3JE4IrPVSU3IWqOHGR7.76i6LW2fWdywOEKzk94TLqWCQW', '08010000004', 'Chief Operating Officer', 'coo', TRUE, 'active'),
('Tunde Accountant', 'tunde.accountant', 'accountant@lighthill.test', '$2b$10$8B/DT.W3JE4IrPVSU3IWqOHGR7.76i6LW2fWdywOEKzk94TLqWCQW', '08010000005', 'Company Accountant', 'accountant', TRUE, 'active'),
('Admin User', 'admin.user', 'admin@lighthill.test', '$2b$10$8B/DT.W3JE4IrPVSU3IWqOHGR7.76i6LW2fWdywOEKzk94TLqWCQW', '08010000006', 'System Administrator', 'admin', TRUE, 'active');
