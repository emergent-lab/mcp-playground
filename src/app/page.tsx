import { headers } from "next/headers";
import { PlaygroundLayout } from "@/components/playground-layout";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return <PlaygroundLayout session={session} />;
}
