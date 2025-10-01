import PostForm from "@/components/PostForm";
import ClubViewer from "@/components/ClubViewer";

export default function ClubPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <PostForm />
      <ClubViewer />
    </div>
  );
}