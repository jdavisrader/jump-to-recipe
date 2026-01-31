# Transform Phase

This directory contains scripts for transforming legacy relational data into the new JSONB-based schema.

## Key Components

### Implemented
- `user-transformer.ts` - User data transformation (✓ Complete)
- `user-mapping-generator.ts` - User ID mapping table generation (✓ Complete)
- `transform-users-example.ts` - Example usage and testing (✓ Complete)
- `index.ts` - Module exports

### Planned
- `recipe-transformer.ts` - Recipe data transformation
- `ingredient-parser.ts` - Ingredient text parsing
- `instruction-cleaner.ts` - HTML cleaning and formatting

## User Transformation

### Features
- Transforms legacy user records to new schema format
- Generates UUID for each user
- Maps `username` → `name` (fallback to email prefix if null)
- Maps `super_user` flag → `role` ('admin' or 'user')
- Sets default values for new fields (password=null, emailVerified=null, image=null)
- Preserves timestamps from legacy system
- Generates comprehensive user mapping table (legacy_id → new_uuid)
- Validates mapping integrity
- Exports mapping as JSON and CSV

### Transformation Rules

1. **UUID Generation**: Each user gets a new UUID identifier
2. **Name Mapping**: 
   - If `username` exists and is not empty → use `username`
   - If `username` is null or empty → use email prefix (before @)
3. **Role Mapping**:
   - `super_user: true` → `role: 'admin'`
   - `super_user: false` → `role: 'user'`
4. **Default Values**:
   - `password: null` (users will authenticate via OAuth or password reset)
   - `emailVerified: null`
   - `image: null`
5. **Timestamp Preservation**: `created_at` and `updated_at` are preserved

### Usage

#### Transform Users from Extracted Data

```typescript
import { runUserTransformation } from './transform/transform-users-example';

const extractedDataDir = 'migration-data/raw/2026-01-24-12-00-00';
const outputDir = 'migration-data';

await runUserTransformation(extractedDataDir, outputDir);
```

#### Transform a Single User

```typescript
import { transformUser } from './transform/user-transformer';
import type { LegacyUser } from './types/extraction';

const legacyUser: LegacyUser = {
  id: 1,
  email: 'john.doe@example.com',
  username: 'johndoe',
  encrypted_password: 'hash',
  super_user: false,
  created_at: '2020-01-15T10:30:00Z',
  updated_at: '2023-06-20T14:45:00Z',
};

const transformedUser = transformUser(legacyUser);
```

#### Lookup User by Legacy ID

```typescript
import { getUserUuidByLegacyId } from './transform/user-transformer';
import { loadUserMapping } from './transform/user-mapping-generator';

const mapping = await loadUserMapping('migration-data/transformed/user-mapping.json');
const newUuid = getUserUuidByLegacyId(42, mapping);
```

#### Lookup User by Email

```typescript
import { getUserUuidByEmail } from './transform/user-transformer';

const newUuid = getUserUuidByEmail('user@example.com', mapping);
```

### Output Files

Creates `migration-data/transformed/{timestamp}/` with:

#### users-normalized.json
Array of transformed user records in new schema format:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "johndoe",
    "email": "john.doe@example.com",
    "emailVerified": null,
    "password": null,
    "image": null,
    "role": "user",
    "createdAt": "2020-01-15T10:30:00.000Z",
    "updatedAt": "2023-06-20T14:45:00.000Z",
    "legacyId": 1
  }
]
```

#### user-mapping.json
Mapping table with indexes for fast lookup:
```json
{
  "generatedAt": "2026-01-24T12:00:00.000Z",
  "totalMappings": 150,
  "mappings": [
    {
      "legacyId": 1,
      "newUuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@example.com",
      "migrated": false,
      "migratedAt": "2026-01-24T12:00:00.000Z"
    }
  ],
  "index": {
    "byLegacyId": { "1": "550e8400-..." },
    "byEmail": { "john.doe@example.com": "550e8400-..." }
  }
}
```

#### user-mapping.csv
CSV export for easy viewing in spreadsheet applications:
```csv
legacy_id,new_uuid,email,migrated,migrated_at
1,"550e8400-e29b-41d4-a716-446655440000","john.doe@example.com",false,"2026-01-24T12:00:00.000Z"
```

#### user-transformation-report.json
Comprehensive transformation report:
```json
{
  "timestamp": "2026-01-24T12:00:00.000Z",
  "inputFile": "migration-data/raw/.../users.json",
  "outputDirectory": "migration-data/transformed/...",
  "statistics": {
    "total": 150,
    "successful": 150,
    "failed": 0,
    "adminCount": 5,
    "userCount": 145
  },
  "validation": {
    "valid": true,
    "errors": []
  },
  "errors": []
}
```

#### user-transformation-errors.json (if any errors)
Details of any transformation failures:
```json
[
  {
    "phase": "user",
    "recordId": 42,
    "error": "Email is required",
    "originalData": { ... }
  }
]
```

## Requirements Satisfied

### User Transformation (Task 4)
- ✓ 2.8: Generate UUIDs for all records
- ✓ 2.9: Set default values for new fields
- ✓ 9.1: Transform legacy user data to match new schema
- ✓ 9.2: Map username → name
- ✓ 9.3: Preserve email and ensure uniqueness
- ✓ 9.4: Generate UUIDs for all user records
- ✓ 9.5: Set default values for new fields
- ✓ 9.6: Handle password migration (set to null)
- ✓ 9.7: Preserve timestamps
- ✓ 9.8: Create mapping table (legacy_id → new_uuid)
- ✓ 9.13: Map super_user flag to role field

## Next Steps

1. Implement recipe transformation (Task 5)
2. Implement ingredient parsing (Task 5.2)
3. Implement instruction cleaning (Task 5.3)
4. Implement validation layer (Task 6)
