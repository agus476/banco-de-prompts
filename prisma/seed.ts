import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/constants";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

const SAMPLE_PROMPTS = [
  {
    title: "Explicar un fragmento de código",
    description: "Para entender código propio o generado por IA antes de usarlo.",
    content:
      "Explicá este código paso a paso. Quiero entender:\n1. el flujo de datos;\n2. las estructuras usadas;\n3. la complejidad aproximada;\n4. las decisiones de diseño;\n5. qué partes son críticas.\n\nNo reescribas el código salvo que haga falta para la explicación.\n\nCódigo:\n",
    category: "Desarrollo",
    tags: "explicación, código, estudio",
    usageContext: "Defensa de trabajos prácticos",
    tool: "ChatGPT",
  },
  {
    title: "Debugging de un error concreto",
    description: "Para aislar un fallo con evidencia, no con conjeturas.",
    content:
      "Estoy depurando este error. No reescribas todo el programa.\n\nError:\n\nCódigo relevante:\n\nQué ya probé:\n\nPedime la hipótesis más probable, cómo verificarla y el cambio mínimo.",
    category: "Debugging",
    tags: "debug, error",
    usageContext: "Debugging de código",
    tool: "Claude",
  },
  {
    title: "Analizar complejidad de un algoritmo",
    description: "Útil para justificar una solución en un TP.",
    content:
      "Analizá la complejidad temporal y espacial de este algoritmo. Distinguí mejor caso, caso promedio y peor caso si aplica. Señalá cuellos de botella y posibles mejoras, sin cambiar el enfoque salvo que esté incorrecto.\n\nAlgoritmo:\n",
    category: "Investigación",
    tags: "algoritmos, complejidad",
    usageContext: "Trabajos de Inteligencia Artificial",
    tool: "ChatGPT",
  },
];

async function main() {
  for (const name of DEFAULT_CATEGORIES) {
    const slug = slugify(name);
    await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
  }

  const promptCount = await prisma.prompt.count();
  if (promptCount > 0) return;

  for (const sample of SAMPLE_PROMPTS) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: slugify(sample.category) },
    });

    const prompt = await prisma.prompt.create({
      data: {
        title: sample.title,
        description: sample.description,
        content: sample.content,
        usageContext: sample.usageContext,
        tool: sample.tool,
        categoryId: category.id,
      },
    });

    for (const name of sample.tags.split(",").map((item) => item.trim())) {
      const slug = slugify(name);
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
      });
      await prisma.promptTag.create({
        data: { promptId: prompt.id, tagId: tag.id },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
