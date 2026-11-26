import { PrismaClient } from "@prisma/client";
import { DEMO_CHANGELOGS, DEMO_PROJECTS, DEMO_ROADMAP_ITEMS } from "../src/lib/mock-data.ts";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "founder@acme.dev" },
    update: {},
    create: {
      email: "founder@acme.dev",
      name: "Alex Rivera",
      githubLogin: "alexrivera",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      plan: "PRO",
      ownerId: user.id,
    },
  });

  for (const proj of DEMO_PROJECTS) {
    const project = await prisma.project.upsert({
      where: { slug: proj.slug },
      update: {},
      create: {
        name: proj.name,
        slug: proj.slug,
        description: proj.description,
        githubRepo: proj.githubRepo,
        defaultBranch: proj.defaultBranch,
        workspaceId: workspace.id,
      },
    });

    if (proj.slug === "acme-cloud") {
      for (const chg of DEMO_CHANGELOGS) {
        await prisma.changelog.create({
          data: {
            projectId: project.id,
            version: chg.version,
            title: chg.title,
            summary: chg.summary,
            features: chg.features,
            improvements: chg.improvements,
            bugFixes: chg.bugFixes,
            status: chg.status,
            publishedAt: chg.status === "PUBLISHED" ? new Date(chg.publishedAt) : null,
          },
        });
      }

      for (const rm of DEMO_ROADMAP_ITEMS) {
        await prisma.roadmapItem.create({
          data: {
            projectId: project.id,
            title: rm.title,
            description: rm.description,
            status: rm.status,
            category: rm.category,
            votes: rm.votes,
            authorName: rm.authorName,
          },
        });
      }
    }
  }

  console.log("Seeded ShipLog database successfully.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

