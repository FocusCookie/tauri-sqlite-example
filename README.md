I’m currently building my first Tauri app and needed a persistent data storage solution. After some research, I came across the SQL Plugin on the Tauri website. However, I have zero experience with Rust, and let's just say I spent a few hours banging my head against the wall trying to make it work! 😅

To save you time (and maybe some frustration), here’s a step-by-step guide to help you get SQLite working with Tauri 2.0 and a React frontend. 😉

## 🚀 Setting Up SQLite with React Frontend in Tauri 2.0

Tauri is an exciting framework for building modern, cross-platform desktop applications using web technologies like **React**. In this guide, we will integrate an **SQLite database into Tauri** using the **Tauri SQL plugin** and build a small app with **React**.

---

## 🛠 Prerequisites

- **npm** (Node.js)
- **Rust** setup for Tauri
  - Install using [Rust’s official installation guide](https://www.rust-lang.org/tools/install).

---

## Step 1: Create a Tauri App

Start by creating a new Tauri project using the `npm` initializer.

```bash
npm create tauri-app@latest
```

### Select the following options:

- **Framework**: React
- **Language**: Typescript

Once the project is created, navigate into the project folder and install the initial dependencies:

```bash
cd my-tauri-app
npm install
```

---

## Step 2: Install the Tauri **SQL Plugin**

We will use the `Tauri SQL Plugin` for managing SQLite connections and executions.

- To add the SQL plugin to your project, run:

```bash
npm run tauri add sql
```

Navigate to the `src-tauri` directory and add the `tauri-plugin-sql` crate with the `sqlite` feature enabled:

```bash
cd src-tauri
cargo add tauri-plugin-sql --features sqlite
```

---

## Step 3: Configure Permissions

To allow SQL operations in Tauri, we need to update the permissions in `src-tauri/capabilities/default.json`.

- Open `src-tauri/capabilities/default.json` and add the following permissions:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "sql:default",
    "sql:allow-load",
    "sql:allow-execute",
    "sql:allow-select",
    "sql:allow-close"
  ]
}
```

This ensures the application is allowed to connect with SQLite and perform necessary CRUD operations.

---

## Step 4: Define Database Migrations

Now that the plugin is set up, let's define the migrations to initialize the SQLite database with a table for **users**.

1. Open `src-tauri/src/lib.rs`.
2. Add the following code to define a basic migration for a `users` table:

```rust
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create users table",
            sql: "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT
            )",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:test.db", migrations)
                .build()
        )
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
```

Here, we define a migration that creates a `users` table with columns for **id**, **name**, and **email**.

> **Note:** The migration ensures the table is created only if it doesn't already exist, using the `IF NOT EXISTS` clause.

---

## Step 5: React Integration

Let's now create the React frontend to interact with the SQLite database.

1. Open `src/App.tsx` and replace its content with the following code:

```tsx
import { useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import "./App.css";

type User = {
  id: number;
  name: string;
  email: string;
};

function App() {
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function getUsers() {
    try {
      const db = await Database.load("sqlite:test.db");
      const dbUsers = await db.select<User[]>("SELECT * FROM users");

      setError("");
      setUsers(dbUsers);
      setIsLoadingUsers(false);
    } catch (error) {
      console.log(error);
      setError("Failed to get users - check console");
    }
  }

  async function setUser(user: Omit<User, "id">) {
    try {
      setIsLoadingUsers(true);
      const db = await Database.load("sqlite:test.db");

      await db.execute("INSERT INTO users (name, email) VALUES ($1, $2)", [
        user.name,
        user.email,
      ]);

      getUsers().then(() => setIsLoadingUsers(false));
    } catch (error) {
      console.log(error);
      setError("Failed to insert user - check console");
    }
  }

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <main className="container">
      <h1>Welcome to Tauri + SQLite</h1>

      {isLoadingUsers ? (
        <div>Loading users...</div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              setUser({ name, email });
              getUsers();
            }}>
            <input
              id="name-input"
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Enter a name..."
            />
            <input
              type="email"
              id="email-input"
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="Enter an email..."
            />
            <button type="submit">Add User</button>
          </form>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <h1>Users</h1>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && <p>{error}</p>}
    </main>
  );
}

export default App;
```

### What This Does:

- This is a very quick and dirty test page, so please change it to suit your needs 😉
- It displays a list of users from the `users` table in SQLite.
- You can add new users to the database through the form.
- The React app communicates with SQLite using the **Tauri SQL plugin**.

---

## Step 6: Build and Run

Now you are ready to build and run the complete Tauri application.

1. Run the development server:

```bash
npm run tauri dev
```

2. If you've configured everything correctly, the Tauri window will open, connecting to the SQLite database and rendering the user interface.

> **Note:** The SQL connection will not work with `npm run dev`, because it will use the invoke function from Tauri, which is only available in the Tauri window.

---

## 🎉 Conclusion

You've successfully set up **Tauri 2.0** with **SQLite** and a **React frontend**!

- We installed the **Tauri SQL Plugin**, created basic **SQLite migrations** for a `users` table, and integrated it with React to view and add users.

Feel free to fork this setup and make it your own for more complex applications. Happy coding! 🚀

---

Be sure to check out more [Tauri Documentation](https://v2.tauri.app/) if you want to dive deeper into its capabilities and explore other plugins.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
