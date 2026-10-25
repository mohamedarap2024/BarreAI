import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GetStarted } from "@/components/get-started";

export default async function GetStartedPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return <GetStarted />;
}
