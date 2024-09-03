import React, { useState } from 'react';

// Users data type definition
type User = {
  id: string;
  name: string;
  email: string;
  age: number;
}

// User Table component definition
const UserTable = ({ users }: { users: User[] }) => {
  const [tableUsers, setTableUsers] = useState(users);

  const handleInputChange = (id: string, field: keyof User, value: string | number) => {
    const updatedUsers = tableUsers.map(user =>
      user.id === id ? { ...user, [field]: value } : user
    );
    setTableUsers(updatedUsers);
  };

  return (
    <table>
      <thead>
        <tr>
          {['ID', 'Name', 'Email', 'Age'].map(header => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableUsers.map(user => (
          <tr key={user.id}>
            {Object.keys(user).map((key: any) => (
              <td key={key}>
                <input
                  type={key === 'age' ? 'number' : 'text'}
                  value={user[key as keyof User]}
                  onChange={(e) => handleInputChange(user.id, key as keyof User, key === 'age' ? Number(e.target.value) : e.target.value)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Helper function to generate random users
const generateRandomUsers = (count: number): User[] => {
  const randomString = () => Math.random().toString(36).substring(7);
  const randomAge = () => Math.floor(Math.random() * 60) + 18;

  return Array.from({ length: count }, (_, index) => ({
    id: `user-${index}-${randomString()}`,
    name: `User${index}`,
    email: `user${index}@example.com`,
    age: randomAge()
  }));
}

// Main component definition
export function TestUserComponent() {
  const [users, setUsers] = useState<User[]>(generateRandomUsers(10));

  return (
    <div>
      <h1>User Table</h1>
      <UserTable users={users} />
    </div>
  );
}