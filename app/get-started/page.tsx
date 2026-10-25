import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GetStarted } from "@/components/get-started";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function GetStartedPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  return <GetStarted error={params.error} />;
}
