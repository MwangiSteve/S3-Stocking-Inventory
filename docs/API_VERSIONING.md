# API Versioning Strategy

## Overview
The Stockly API uses URL-based versioning to maintain backward compatibility.

## Current Version
- **v1**: Current stable version

## Versioning Rules
1. Breaking changes require new API version
2. Non-breaking changes (new fields, endpoints) supported in existing version
3. Deprecation notice provided 6 months before version retirement
4. All requests include API-Version header in response

## Endpoint Structure

```
pages/api/
├── v1/
│   ├── auth/
│   │   ├── login.ts       POST   - User login
│   │   ├── register.ts    POST   - User registration
│   │   ├── logout.ts      POST   - User logout
│   │   └── session.ts     GET    - Get current session
│   ├── products/
│   │   ├── index.ts       GET/POST/DELETE - List/create/delete products
│   │   └── [id].ts        GET/PUT/DELETE  - Get/update/delete a product
│   ├── categories/
│   │   └── index.ts       GET/POST/PUT/DELETE - Manage categories
│   ├── suppliers/
│   │   └── index.ts       GET/POST/PUT/DELETE - Manage suppliers
│   └── audit-logs/
│       └── index.ts       GET    - Fetch audit logs
└── health.ts              GET    - Health check (version-independent)
```

## Migration Guide
To upgrade from v0 to v1:
1. Update base URL from `/api/` to `/api/v1/`
2. Review breaking changes in changelog
3. Update request/response handling

The products list endpoint (`GET /api/v1/products`) now returns a paginated response:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true,
    "pageCount": 10
  }
}
```

### Pagination Parameters
| Parameter | Type   | Default | Description             |
|-----------|--------|---------|-------------------------|
| limit     | number | 10      | Items per page (max 100)|
| offset    | number | 0       | Number of items to skip |

## Response Headers
All API responses include:
- `API-Version: v1`
- `Deprecation: false` (for current versions)
