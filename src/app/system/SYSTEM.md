# DISTRO SYSTEM

## Application Architecture

The Distro platform consists of:

1. Angular frontend
2. Spring Boot backend
3. Database

The frontend communicates with the backend through REST APIs.

---

# CORE SYSTEM FLOW

```text
                    LOGIN
                      |
                      v
               AUTHENTICATION
                      |
                      v
                  DASHBOARD
                      |
             +--------+--------+
             |                 |
             v                 v
           USERS        ORGANIZATIONS
             |                 |
             |        +--------+--------+
             |        |        |        |
             v        v        v        v
        INVITATIONS PRODUCTS INVENTORY USERS
                          |
                          v
                        ORDERS
                          |
                    +-----+-----+
                    |           |
                    v           v
                PAYMENTS    DELIVERIES
                    |           |
                    +-----+-----+
                          |
                          v
                    NOTIFICATIONS
                          |
                          v
                       REPORTS

                       Admin
  |
  v
Invite User Page
  |
  v
InvitationService
  |
  v
POST /api/invitations
  |
  v
InvitationController
  |
  v
InvitationService
  |
  v
InvitationRepository
  |
  v
Database
  |
  v
InvitationResponse
  |
  v
Angular

Organizations Page
       |
       v
OrganizationService
       |
       v
/api/organizations
       |
       v
OrganizationController
       |
       v
OrganizationService
       |
       v
OrganizationRepository
       |
       v
Database

Products Page
      |
      v
ProductService
      |
      v
Products API
      |
      v
Backend
      |
      v
Database

Inventory Page
      |
      v
InventoryService
      |
      v
Inventory API
      |
      v
Backend
      |
      v
Database

Product
   |
   v
Inventory
   |
   v
Order
   |
   +----------+
   |          |
   v          v
Payment    Delivery