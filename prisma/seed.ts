import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  const doctor = await prisma.doctor.create({
    data: {
      name: "Dr. Alfredo Marques",
      specialty: "Implantodontia",
      isActive: true,
    },
  });
  console.log("Doutor criado:", doctor.name, "| ID:", doctor.id);

  const procedure = await prisma.procedure.create({
    data: {
      name: "Implante Dentário",
      description: `Especialidade da Floren Odonto. Processo completo:

ETAPAS:
- Planejamento Digital 3D: simulação do sorriso e planejamento cirúrgico
- Guias Cirúrgicos Impressos em 3D: máxima precisão na instalação dos implantes
- Cirurgia Guiada Minimamente Invasiva: cortes reduzidos, menos dor e recuperação rápida

TECNOLOGIAS:
- Tomografia Computadorizada: imagens 3D detalhadas para diagnóstico e planejamento
- Escâner Intraoral 3D: substitui moldagens convencionais, mais conforto ao paciente
- Fresadoras CAD/CAM: produção rápida de próteses personalizadas e estéticas
- Implantes de Titânio ou Zircônia: biocompatíveis, resistentes e modernos
- Biomateriais de Regeneração Óssea: suporte quando há necessidade de aumentar volume ósseo

BENEFÍCIOS:
- Tratamentos com alta previsibilidade e segurança
- Estética natural e duradoura
- Recuperação mais rápida e confortável
- Procedimentos não invasivos e indolor
- Soluções personalizadas: desde a perda de um dente até reabilitação total`,
    },
  });
  console.log("Procedimento criado:", procedure.name, "| ID:", procedure.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
