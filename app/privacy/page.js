import PublicShell from "@/components/PublicShell";
import Container from "@/components/Container";

export default function PrivacyPage() {
  return (
    <PublicShell>
      <Container className="py-10 lg:py-16">
        <div className="max-w-3xl">
          <h1 className="page-title">Privacy Policy</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Khaki collects account, task, chat, and posting-fee records needed to run the Palawan marketplace. Job payment stays between poster and tasker. Do not share PayMongo secret keys in the browser or mobile app.
          </p>
        </div>
      </Container>
    </PublicShell>
  );
}
