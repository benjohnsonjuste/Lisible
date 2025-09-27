import EventRegistrationForm from "@/components/EventRegistrationForm";
import TextSubmissionForm from "@/components/TextSubmissionForm";

export default function BattlePoetique() {
  const eventId = "battle-poetique";

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Battle Poétique International</h1>
      <EventRegistrationForm eventId={eventId} />
      <TextSubmissionForm eventId={eventId} phase={1} authorId="example-author-id" />
    </div>
  );
    }
