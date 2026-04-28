import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TimeTracker",
  description: "Gestión de horas y proyectos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
