import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
}

interface RegisterData {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    complemento?: string;
    referencia?: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simulated users database
const INITIAL_USERS: (User & { senha: string })[] = [
  {
    id: 'admin-1',
    nome: 'Administrador',
    telefone: '(11) 99999-9999',
    email: 'admin@pointdoacai.com',
    senha: 'admin123',
    role: 'admin',
    endereco: { rua: '', numero: '', bairro: '' },
    valorTotalCompras: 0,
  },
  {
    id: 'admin-2',
    nome: 'Allan Jones',
    telefone: '(11) 99999-0000',
    email: 'allanjonesms@gmail.com',
    senha: '@Jones2028',
    role: 'admin',
    endereco: { rua: '', numero: '', bairro: '' },
    valorTotalCompras: 0,
  },
  {
    id: 'cliente-1',
    nome: 'João Silva',
    telefone: '(11) 98888-8888',
    email: 'joao@email.com',
    senha: 'cliente123',
    role: 'cliente',
    endereco: {
      rua: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
      complemento: 'Apto 45',
      referencia: 'Próximo à padaria',
    },
    valorTotalCompras: 156.00,
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<(User & { senha: string })[]>(INITIAL_USERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('pointdoacai_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // Load saved users
    const savedUsers = localStorage.getItem('pointdoacai_users');
    if (savedUsers) {
      setAllUsers(JSON.parse(savedUsers));
    }
    
    setIsLoading(false);
  }, []);

  const saveUsers = (users: (User & { senha: string })[]) => {
    setAllUsers(users);
    localStorage.setItem('pointdoacai_users', JSON.stringify(users));
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = allUsers.find(u => u.email === email && u.senha === password);
    
    if (foundUser) {
      const { senha, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('pointdoacai_user', JSON.stringify(userWithoutPassword));
      return { success: true };
    }

    return { success: false, error: 'E-mail ou senha incorretos' };
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const existingUser = allUsers.find(u => u.email === userData.email);
    if (existingUser) {
      return { success: false, error: 'Este e-mail já está cadastrado' };
    }

    const newUser: User & { senha: string } = {
      id: `cliente-${Date.now()}`,
      nome: userData.nome,
      telefone: userData.telefone,
      email: userData.email,
      senha: userData.senha,
      role: 'cliente',
      endereco: userData.endereco,
      valorTotalCompras: 0,
    };

    saveUsers([...allUsers, newUser]);
    
    const { senha, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('pointdoacai_user', JSON.stringify(userWithoutPassword));
    return { success: true };
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    const updatedUsers = allUsers.map(u => 
      u.id === userId ? { ...u, ...data } : u
    );
    saveUsers(updatedUsers);
    
    // Update current user if it's the same
    if (user?.id === userId) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('pointdoacai_user', JSON.stringify(updatedUser));
    }
  };

  const deleteUser = (userId: string) => {
    const filteredUsers = allUsers.filter(u => u.id !== userId);
    saveUsers(filteredUsers);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pointdoacai_user');
    localStorage.removeItem('pointdoacai_carrinho');
  };

  // Users without passwords for external use
  const users: User[] = allUsers.map(({ senha, ...u }) => u);

  return (
    <AuthContext.Provider value={{ user, users, isLoading, login, register, logout, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
