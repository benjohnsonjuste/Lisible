import FoireInscriptionForm from "@/components/FoireInscriptionForm";

export default function FoireVirtuelle() {
  const eventId = "foire-virtuelle";

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Foire Virtuelle Cheikh Anta Diop</h1>
      <EventRegistrationForm eventId={eventId} />
      <TextSubmissionForm eventId={eventId} phase={1} authorId="example-author-id" />
    </div>
  );
}
