import { LoginCard } from "@/components/login-card";

export default function AdminLogin() {
  return <LoginCard roles={["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"]} title="Back office sign in" />;
}
