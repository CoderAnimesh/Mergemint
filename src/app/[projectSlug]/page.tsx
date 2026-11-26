import { redirect } from "next/navigation";

export default async function ProjectHubIndex({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  redirect(`/${projectSlug}/changelog`);
}

