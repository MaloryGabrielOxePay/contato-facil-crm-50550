
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Página não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A página que você está procurando não existe ou foi movida.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => window.history.back()} variant="outline" className="gap-2">
              <ArrowLeft size={16} />
              Voltar
            </Button>
            <Button asChild className="gap-2">
              <a href="/">
                <Home size={16} />
                Início
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
