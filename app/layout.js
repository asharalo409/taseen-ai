import './globals.css';
import { LangProvider } from './providers';

export const metadata = {
  title: 'Taseen AI',
  description: 'Personal AI Agent',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#05060a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
