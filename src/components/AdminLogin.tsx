import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, LogIn, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AdminLoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  getDefaultCredentials: () => { email: string; password: string };
}

export const AdminLogin = ({ onLogin, getDefaultCredentials }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultCreds = getDefaultCredentials();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Si us plau, introdueixi usuari i contrasenya');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Si us plau, introdueixi un correu electrònic vàlid');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await onLogin(email.trim().toLowerCase(), password);
      if (success) {
        toast.success('Benvingut, Administrador!');
        setEmail('');
        setPassword('');
      } else {
        toast.error('Credencials incorrectes. Verifiqui usuari i contrasenya.');
      }
    } catch (error) {
      toast.error('Error d\'autenticació. Torneu-ho a provar.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultCredentials = () => {
    setEmail(defaultCreds.email);
    setPassword(defaultCreds.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-600 rounded-full w-fit">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Accés d'Administrador</CardTitle>
          <p className="text-muted-foreground">
            Introdueixi les seves credencials per accedir al sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Correu Electrònic</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Contrasenya</Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Introdueixi la contrasenya"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              <LogIn className="h-4 w-4 mr-2" />
              {isLoading ? 'Accedint...' : 'Accedir al Panell'}
            </Button>
          </form>
          
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium">Administrador per Defecte:</p>
              <p className="text-xs">Usuari: {defaultCreds.email}</p>
              <p className="text-xs">Contrasenya: {defaultCreds.password}</p>
              <Button 
                onClick={fillDefaultCredentials}
                variant="ghost" 
                size="sm" 
                className="mt-2 text-blue-600 hover:text-blue-800 p-0 h-auto"
                disabled={isLoading}
              >
                Emplenar credencials per defecte
              </Button>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
              <p className="font-medium">Nota Important:</p>
              <p className="text-xs">Les contrasenyes s'envien per correu electrònic quan es creen nous administradors.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};