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
