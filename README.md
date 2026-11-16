# AngularAdminPractice

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.8.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

Local API requests are forwarded by the Angular development server to
`https://distro-backend-09e7.onrender.com`, so the browser talks to the local
origin and does not need a development CORS exception. The backend must be
running and reachable, and valid backend credentials are still required to log
in. Production builds call the API directly, so the backend must allow the
deployed frontend's origin through its CORS configuration.

## Product categories

Product categories are shared across organizations and managed by platform
administrators from **Product Categories**. The frontend expects the backend
to expose these endpoints under `/api/v1/products/categories`:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/products/categories` | List active category names as strings |
| `POST` | `/api/v1/products/categories` | Create a category with `{ "name": "..." }` |
| `PUT` | `/api/v1/products/categories/{name}` | Rename a category with `{ "name": "..." }` |
| `DELETE` | `/api/v1/products/categories/{name}` | Deactivate a category without deleting existing products |

The products endpoint should accept an optional `category` query parameter so
category pages paginate the matching products on the server. Renaming a
category should update existing products' category references; deactivation
should retain those references while preventing the category from being
selected for new products.

## Organization directories

Platform administrators access separate manufacturer and distributor
directories; organization members continue to use their scoped dashboards.
Both directories read `/api/organizations` and organization details from
`/api/organizations/{id}`. The detail view displays the counts returned by the
backend. In addition to `userCount` and `productCount`, the response can
provide `adminCount`, `staffCount`, and `driverCount`; manufacturer details can
also provide `availableProductCount` and `inventoryUnits` (or
`inventoryCount`), while distributor details can provide `truckCount` and
`availableTruckCount`. Counts omitted by the backend are shown as unavailable
rather than inferred from unrelated or sample data.

The directory expects `PATCH /api/organizations/{id}/status` with
`{ "status": "ACTIVE" | "INACTIVE" }` to activate or deactivate an
organization. Creation sends `name`, `type`, `contactName`, `email`, `phone`,
and `location`;
the backend should persist and return the supplied organization email and
contact information. Member names and emails are derived from `/api/admin/users`;
the directory requests `/api/admin/users?organizationId={id}` and the response
should include each member's `organizationId` (preferred) or
`organizationName` so it can associate members with an organization.
User status changes use the existing
`PATCH /api/admin/users/{id}/status` endpoint. To show staff invitation
progress, user records may also return `invitationStatus`, `otpDeliveryStatus`,
`activationLinkDeliveryStatus`, and `invitationSentAt`. These are delivery
statuses only; the UI must never expose OTP values or activation tokens.

## Logistics management

Driver, fleet, shipment, shared-load, and trip screens use backend data rather
than local sample records. Collection endpoints may return either a JSON array
or a Spring page response with a `content` array. The screens expect individual
and created/updated responses to match the corresponding model in
`src/app/models`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/v1/drivers` | List drivers; register a driver |
| `GET` | `/api/v1/drivers/{id}` | Read driver details |
| `PATCH` | `/api/v1/drivers/{id}/status` | Update driver status with `{ "status": "APPROVED" }` |
| `POST` | `/api/v1/drivers/{id}/invitation/resend` | Resend a driver invitation |
| `POST` | `/api/v1/drivers/{id}/authorizations` | Request organization authorization |
| `PATCH` | `/api/v1/drivers/{id}/authorizations/{organizationId}/status` | Update authorization status |
| `GET`, `POST` | `/api/v1/vehicles` | List vehicles; register a vehicle |
| `GET` | `/api/v1/vehicles/{id}` | Read vehicle details |
| `PATCH` | `/api/v1/vehicles/{id}/status` | Update vehicle status |
| `PATCH` | `/api/v1/vehicles/{id}/driver` | Assign or clear a driver with `{ "driverId": "..." }` |
| `GET`, `POST` | `/api/v1/shipments` | List shipments; create a shipment |
| `GET` | `/api/v1/shipments/{id}` | Read shipment details |
| `PATCH` | `/api/v1/shipments/{id}/status` | Update shipment status |
| `GET` | `/api/v1/shared-loads` | List shared-load recommendations |
| `GET` | `/api/v1/shared-loads/{id}` | Read a recommendation |
| `PATCH` | `/api/v1/shared-loads/{id}/confirmations` | Update a confirmation with `{ "organizationName": "...", "decision": "ACCEPTED" }` |
| `POST` | `/api/v1/shared-loads/{id}/reset` | Reset recommendation confirmations |
| `GET`, `POST` | `/api/v1/trips` | List trips; create a trip |
| `GET` | `/api/v1/trips/{id}` | Read trip details |
| `PATCH` | `/api/v1/trips/{id}/status` | Update trip status |
| `PATCH` | `/api/v1/trips/{id}/stops/{stopId}/status` | Update trip-stop status |

Organizations used by vehicle and shipment forms are loaded from
`/api/organizations`; driver options for fleet and trip forms are loaded from
`/api/v1/drivers`. API failures are shown in the relevant screen rather than
replaced with sample data.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
