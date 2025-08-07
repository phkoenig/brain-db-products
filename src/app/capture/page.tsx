import { ProtectedRoute } from "@/components/ProtectedRoute";
import CaptureForm from "@/components/CaptureForm";

export default function CapturePage() {
  return (
    <ProtectedRoute>
      <CaptureForm />
    </ProtectedRoute>
  );
}

