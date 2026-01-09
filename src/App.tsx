import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CarrinhoProvider } from "@/contexts/CarrinhoContext";
import { PedidosProvider } from "@/contexts/PedidosContext";
import { AdminRoute } from "@/components/AdminRoute";
import { SessionBar } from "@/components/SessionBar";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import ClienteHome from "./pages/cliente/Home";
import NovoPedido from "./pages/cliente/NovoPedido";
import Carrinho from "./pages/cliente/Carrinho";
import MeusPedidos from "./pages/cliente/MeusPedidos";
import Perfil from "./pages/cliente/Perfil";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClientes from "./pages/admin/Clientes";
import EditarCliente from "./pages/admin/EditarCliente";
import AdminProdutos from "./pages/admin/Produtos";
import PedidoDireto from "./pages/admin/PedidoDireto";
import AdminRelatorios from "./pages/admin/Relatorios";
import AdminEnderecos from "./pages/admin/Enderecos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Páginas onde NÃO exibir a SessionBar
const hideSessionBarRoutes = ['/login', '/cadastro', '/esqueci-senha', '/redefinir-senha'];

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();

  const showSessionBar = !hideSessionBarRoutes.includes(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {showSessionBar && (
        <SessionBar
          isLoading={isLoading}
          user={user ? { nome: user.nome, role: user.role } : null}
          onLogout={handleLogout}
        />
      )}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        
        {/* Cliente Routes */}
        <Route path="/home" element={<ClienteHome />} />
        <Route path="/novo-pedido" element={<NovoPedido />} />
        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="/meus-pedidos" element={<MeusPedidos />} />
        <Route path="/perfil" element={<Perfil />} />
        
        {/* Admin Routes - Protected with server-side role verification */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/clientes" element={<AdminRoute><AdminClientes /></AdminRoute>} />
        <Route path="/admin/clientes/:id/editar" element={<AdminRoute><EditarCliente /></AdminRoute>} />
        <Route path="/admin/produtos" element={<AdminRoute><AdminProdutos /></AdminRoute>} />
        <Route path="/admin/pedido-direto" element={<AdminRoute><PedidoDireto /></AdminRoute>} />
        <Route path="/admin/relatorios" element={<AdminRoute><AdminRelatorios /></AdminRoute>} />
        <Route path="/admin/enderecos" element={<AdminRoute><AdminEnderecos /></AdminRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CarrinhoProvider>
            <PedidosProvider>
              <Toaster />
              <Sonner />
              <AppContent />
            </PedidosProvider>
          </CarrinhoProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
