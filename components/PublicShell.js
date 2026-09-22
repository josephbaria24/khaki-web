import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PageEnter } from "@/components/ui/motion";

export default function PublicShell({ children, landing = false }) {
  return (
    <div className={`flex min-h-screen flex-col bg-[#FBF8F1] ${landing ? "khaki-landing" : ""}`}>
      <SiteHeader landing={landing} />
      <PageEnter className="flex-1">{children}</PageEnter>
      <SiteFooter />
    </div>
  );
}
