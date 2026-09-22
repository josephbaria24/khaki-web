import PublicShell from "@/components/PublicShell";
import Container from "@/components/Container";

export default function AboutPage() {
  return (
    <PublicShell>
      <Container className="py-10 lg:py-16">
        <div className="max-w-3xl">
          <h1 className="page-title">About Khaki</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Khaki is the marketplace app for Palaweños. Find work or get help in your town — errands, transport, tourism, repairs, and more. Posting fee is 2% until Feb 2027. The task payment is between poster and tasker.
          </p>
        </div>
      </Container>
    </PublicShell>
  );
}
