import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voces que acompañan",
  description: "Audios de las familias para escuchar en el aula."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
