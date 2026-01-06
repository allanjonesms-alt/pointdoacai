import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute component that verifies admin role server-side
 * before rendering protected admin content.
 * 
 * This provides defense-in-depth beyond RLS policies by:
 * 1. Verifying authentication exists
 * 2. Re-validating admin role from database on each access
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, session, isLoading: authLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verifyAdminRole = async () => {
      if (!session?.user) {
        setIsVerifying(false);
        setIsAdmin(false);
        return;
      }

      try {
        // Re-verify admin role directly from database
        // This ensures we always have fresh role data, not cached client-side state
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error verifying admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!roleData);
        }
      } catch (err) {
        console.error('Error in admin verification:', err);
        setIsAdmin(false);
      } finally {
        setIsVerifying(false);
      }
    };

    if (!authLoading) {
      verifyAdminRole();
    }
  }, [session?.user, authLoading]);

  // Show loading while checking auth and verifying role
  if (authLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  // Not admin - redirect to home
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // Verified admin - render children
  return <>{children}</>;
}
