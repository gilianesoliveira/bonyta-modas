import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Bonyta Modas - Gestão",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#05050a]`}>
        {/* Aqui NÃO vai a Sidebar, apenas os children */}
        {children}
      </body>
    </html>
  );
}