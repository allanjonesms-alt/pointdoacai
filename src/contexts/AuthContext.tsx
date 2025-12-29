import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
const MOCK_USERS: (User & { senha: string })[] = [
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('pointdoacai_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = MOCK_USERS.find(u => u.email === email && u.senha === password);
    
    if (foundUser) {
      const { senha, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('pointdoacai_user', JSON.stringify(userWithoutPassword));
      return { success: true };
    }

    return { success: false, error: 'E-mail ou senha incorretos' };
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const existingUser = MOCK_USERS.find(u => u.email === userData.email);
    if (existingUser) {
      return { success: false, error: 'Este e-mail já está cadastrado' };
    }

    const newUser: User = {
      id: `cliente-${Date.now()}`,
      nome: userData.nome,
      telefone: userData.telefone,
      email: userData.email,
      role: 'cliente',
      endereco: userData.endereco,
      valorTotalCompras: 0,
    };

    setUser(newUser);
    localStorage.setItem('pointdoacai_user', JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pointdoacai_user');
    localStorage.removeItem('pointdoacai_carrinho');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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
