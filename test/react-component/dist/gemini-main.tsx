import React, { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

interface UserTableProps {
  users: User[];
}

const UserTable: React.FC<UserTableProps> = ({ users }) => {
  const [updatedUsers, setUpdatedUsers] = useState(users);

  const handleInputChange = (
    userId: string,
    fieldName: string,
    newValue: string
  ) => {
    const updatedUser = updatedUsers.find((user) => user.id === userId);
    if (updatedUser) {
      setUpdatedUsers([
        ...updatedUsers.filter((user) => user.id !== userId),
        {
          ...updatedUser,
          [fieldName]: newValue,
        },
      ]);
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {updatedUsers.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>
              <input
                type="text"
                value={user.name}
                onChange={(e) =>
                  handleInputChange(user.id, "name", e.target.value)
                }
              />
            </td>
            <td>
              <input
                type="email"
                value={user.email}
                onChange={(e) =>
                  handleInputChange(user.id, "email", e.target.value)
                }
              />
            </td>
            <td>
              <input
                type="number"
                value={user.age}
                onChange={(e) =>
                  handleInputChange(user.id, "age", e.target.value)
                }
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const TestUserComponent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  // Generate 10 random users
  const generateRandomUsers = () => {
    const randomUsers: User[] = [];
    for (let i = 0; i < 10; i++) {
      randomUsers.push({
        id: `user-${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        age: Math.floor(Math.random() * 50) + 18,
      });
    }
    return randomUsers;
  };

  // Generate users on component mount
  React.useEffect(() => {
    setUsers(generateRandomUsers());
  }, []);

  return (
    <div>
      <UserTable users={users} />
    </div>
  );
};

export default TestUserComponent;
