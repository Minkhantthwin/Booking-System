
# Booking API

A Node.js + Express service managing users, roles, services, resources, bookings, payments, availability, and blocked slots with Prisma ORM and JWT-based auth.

## Tech Stack
- Node.js, Express, Prisma ORM
- PostgreSQL (development & test)
- JWT authentication, bcrypt password hashing
- Jest + Supertest automated tests
- Swagger UI for OpenAPI docs

## Quick Start
1. **Install dependencies**  
   ```bash
   npm install
   ```
2. **Generate Prisma client & OpenAPI schemas**  
   ```bash
   npm run generate
   ```
3. **Run migrations (dev DB)**  
   ```bash
   npx prisma migrate deploy
   ```
4. **Seed + run tests (uses `.env.test`)**  
   ```bash
   npm test
   ```
5. **Start API**  
   ```bash
   npm run dev
   ```
   Visit docs at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

## Database ERD
```mermaid
erDiagram
  Role ||--o{ User : "users"
  User ||--o{ Booking : "bookingAsCustomer"
  User ||--o{ Booking : "bookingAsStaff"
  User ||--o{ Availability : "availability"
  User ||--o{ BlockedSlot : "blockedSlots"
  User ||--o{ AuditLog : "auditLogs"
  Resource ||--o{ Availability : "availability"
  Resource ||--o{ BlockedSlot : "blockedSlots"
  Resource ||--o{ Booking : "bookings"
  Service ||--o{ Booking : "bookings"
  Booking ||--o{ Payment : "payments"

  Role {
    Int role_id PK
    String name
    String description
  }
  User {
    Int user_id PK
    Int role_id FK
    String email
    String password_hash
    String name
    String phone
    UserStatus status
    DateTime created_at
    DateTime updated_at
  }
  Service {
    Int service_id PK
    String name
    String description
    Int duration_min
    Decimal price
    ServiceStatus status
  }
  Resource {
    Int resource_id PK
    String name
    String description
    ResourceStatus status
  }
  Availability {
    Int availability_id PK
    Int user_id FK
    Int resource_id FK
    DayOfWeek day_of_week
    DateTime start_datetime
    DateTime end_datetime
  }
  BlockedSlot {
    Int blocked_id PK
    Int user_id FK
    Int resource_id FK
    DateTime start_datetime
    DateTime end_datetime
  }
  Booking {
    Int booking_id PK
    Int customer_id FK
    Int staff_id FK
    Int resource_id FK
    Int service_id FK
    DateTime start_datetime
    DateTime end_datetime
    String notes
    BookingStatus status
    DateTime created_at
    DateTime updated_at
  }
  Payment {
    Int payment_id PK
    Int booking_id FK
    Decimal amount
    PaymentMethod method
    PaymentStatus status
    String transaction_ref
    DateTime created_at
  }
  AuditLog {
    Int log_id PK
    Int user_id FK
    String action
    String entity
    Int entity_id
    String details
    DateTime created_at
  }
```

## Request Flow
```mermaid
sequenceDiagram
  participant Client
  participant Router as Express Router
  participant Auth as Auth Middleware
  participant Controller
  participant Prisma as Prisma Client
  participant DB as PostgreSQL

  Client->>Router: HTTP Request
  Router->>Auth: Validate JWT (if required)
  Auth->>Router: next()
  Router->>Controller: Invoke handler
  Controller->>Prisma: ORM call
  Prisma->>DB: SQL query
  DB-->>Prisma: Result set
  Prisma-->>Controller: Data / error
  Controller-->>Client: JSON response
```

## Testing & Quality
- `npm test` – full suite (`tests/setup.js` resets & seeds DB)
- `npm run test:unit`, `npm run test:integration`, `npm run test:coverage`
- Coverage collected for controllers, routers, middleware

## Documentation
- Swagger UI: `GET /api-docs`
- OpenAPI JSON: `GET /openapi.json`
- Run `npm run generate` after Prisma schema changes to refresh generated docs.