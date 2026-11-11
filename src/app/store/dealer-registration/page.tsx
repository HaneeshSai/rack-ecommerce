import { PageTitle } from "@/components/ui";
import { DealerRegistrationForm } from "@/components/store/forms";

export default function DealerRegistrationPage() {
  return (
    <>
      <PageTitle title="Become a dealer" sub="Get trade prices (ex-GST), bulk ordering, freight options and credit terms." />
      <DealerRegistrationForm />
    </>
  );
}
