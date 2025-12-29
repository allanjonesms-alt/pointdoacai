import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CarrinhoProvider } from "@/contexts/CarrinhoContext";
import { PedidosProvider } from "@/contexts/PedidosContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import ClienteHome from "./pages/cliente/Home";
import NovoPedido from "./pages/cliente/NovoPedido";
import Carrinho from "./pages/cliente/Carrinho";
import MeusPedidos from "./pages/cliente/MeusPedidos";
import Perfil from "./pages/cliente/Perfil";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClientes from "./pages/admin/Clientes";
import AdminProdutos from "./pages/admin/Produtos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CarrinhoProvider>
          <PedidosProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                
                {/* Cliente Routes */}
                <Route path="/home" element={<ClienteHome />} />
                <Route path="/novo-pedido" element={<NovoPedido />} />
                <Route path="/carrinho" element={<Carrinho />} />
                <Route path="/meus-pedidos" element={<MeusPedidos />} />
                <Route path="/perfil" element={<Perfil />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/clientes" element={<AdminClientes />} />
                <Route path="/admin/produtos" element={<AdminProdutos />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </PedidosProvider>
        </CarrinhoProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
