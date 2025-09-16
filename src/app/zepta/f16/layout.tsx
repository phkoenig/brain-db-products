import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "F16 Projekt Portal | ZEPTA",
  description: "Kundenportal für Projekt F16 - ACC Integration, Blog und Bemusterung",
};

export default function F16Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="f16-portal">
        {children}
      </div>
    </AuthProvider>
  );
}
