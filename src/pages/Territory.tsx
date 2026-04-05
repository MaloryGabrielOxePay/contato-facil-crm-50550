import { useCampaign } from "@/contexts/CampaignContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export default function Territory() {
  const { campaign } = useCampaign();
  if (!campaign) return <div className="p-8 text-center text-slate-400">Selecione uma campanha.</div>;
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 flex flex-col items-center text-center">
          <Construction size={48} className="text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Territory</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            Este módulo está em desenvolvimento e será lançado em breve com funcionalidades completas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
