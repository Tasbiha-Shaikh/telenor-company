import "./globals.css";

export const metadata = { title: "Telenor Customer Manager" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}