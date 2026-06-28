import AdminDashboardPage from "../page";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default function AdminSiteSettingsPage({
  searchParams
}: {
  searchParams?: {
    [key: string]: string | undefined;
  };
}) {
  return <AdminDashboardPage searchParams={{ ...searchParams, settingsOnly: "true" }} />;
}
