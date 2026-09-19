"use client";

import { useRouter } from "next/navigation";
import MimiAuth from "./mimi-auth";

export default function AuthRoute() {
  const router = useRouter();
  return <MimiAuth onDemo={() => router.push("/dashboard?demo=1")} />;
}
