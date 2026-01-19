I will implement the Tiered Administrator feature with the following steps:

1.  **Database Updates**:
    *   Create a SQL migration file `update_tiered_admin.sql` to:
        *   Add `managed_users` column (array of text) to `users` table.
        *   Update the `role` check constraint to include `'tiered_admin'`.
        *   (Optional) Update RLS policies to enforce these permissions at the database level.

2.  **Type Definitions**:
    *   Update `src/types/auth.ts`:
        *   Add `'tiered_admin'` to `UserRole` type.
        *   Add `managedUsers?: string[]` to `User` interface.
        *   Update `StoredUser` interface if needed.

3.  **Backend API (`/api/users`)**:
    *   Update `api/users.ts` to handle the new `managed_users` field mapping between frontend (camelCase) and database (snake_case).

4.  **Frontend State (`AuthContext`)**:
    *   Update `src/contexts/AuthContext.tsx` to include:
        *   `updateUserRole`: Function to change a user's role.
        *   `updateUserScope`: Function to update the list of users a tiered admin manages.
        *   Ensure these changes are persisted to both LocalStorage and the API.

5.  **Admin UI (`AdminPanel`)**:
    *   Update `src/pages/Admin/AdminPanel.tsx`:
        *   **Role Management**: Add a UI to toggle a user between 'User', 'Tiered Admin', and 'Admin'.
        *   **Scope Management**: Add a "Manage Scope" button for Tiered Admins that opens a modal to select which users they can manage.
        *   **View Filtering**:
            *   If logged in as `tiered_admin`, filter the user list to ONLY show users in their `managedUsers` list.
            *   Hide "Role" and "Scope" management buttons for Tiered Admins (they cannot promote others).
        *   **Badges**: Add a specific badge style for "Tiered Admin".

6.  **Verification**:
    *   Verify a Super Admin can create a Tiered Admin and assign users.
    *   Verify the Tiered Admin only sees assigned users in the dashboard.
    *   Verify Tiered Admin can view logs/files of assigned users.
