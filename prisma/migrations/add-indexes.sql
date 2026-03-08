-- Add indexes for common queries
-- Note: These are MongoDB index definitions expressed as JS shell commands
-- Apply via MongoDB shell or Atlas UI

db.products.createIndex({ userId: 1, createdAt: -1 });
db.products.createIndex({ status: 1 });
db.categories.createIndex({ userId: 1 });
db.suppliers.createIndex({ userId: 1 });
db.auditLogs.createIndex({ userId: 1, timestamp: -1 });
db.auditLogs.createIndex({ resourceType: 1, resourceId: 1 });
