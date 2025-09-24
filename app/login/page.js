import AuthDialog from "@/components/AuthDialog";

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <AuthDialog type="login" />
    </div>
  );
}
