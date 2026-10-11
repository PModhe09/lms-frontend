import { redirect } from "next/navigation";

// proxy.ts sends "/" to the user's home. This only runs if the proxy is bypassed.
export default function Home() {
  redirect("/login");
}
