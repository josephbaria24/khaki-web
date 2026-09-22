import PublicShell from "@/components/PublicShell";
import Container from "@/components/Container";

export default function TermsPage() {
  return (
    <PublicShell>
      <Container className="py-10 lg:py-16">
        <div className="max-w-3xl">
          <h1 className="page-title">Terms of Service</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            You must be 18 or older. Khaki is a platform connecting posters and taskers and is not responsible for the outcome of a task. Khaki charges a 2% posting fee when you list a task and does not hold the job payment — poster and tasker settle that themselves. Illegal content is prohibited and may result in a ban.
          </p>
        </div>
      </Container>
    </PublicShell>
  );
}
