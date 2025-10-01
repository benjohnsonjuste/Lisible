import UploadForm from "./components/UploadForm";
import PublicationsList from "./components/PublicationsList";

export default function Home() {
  return (
    <div>
      <UploadForm />
      <PublicationsList />
    </div>
  );
}