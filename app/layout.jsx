import './globals.css';

export const metadata = { title: 'Office Housie', description: 'Play Housie (Tambola) with your colleagues. One hosts, everyone joins.' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><main>{children}</main></body>
    </html>
  );
}
