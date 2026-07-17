import { useState } from 'react';
import InvoiceOverview from './components/InvoiceOverview';

type Screen = 'Dashboard' | 'InvoiceOverview' | 'Invoice' | 'InvoicePreview';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('InvoiceOverview');
  const [lang, setLang] = useState<'KH' | 'EN'>('KH');
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);

  // ឧបមាថា user បាន login រួចហើយ
  const profile = { id: 'user_123', name: 'User' };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl">
      {currentScreen === 'InvoiceOverview' && profile && (
        <InvoiceOverview
          lang={lang}
          onBack={() => setCurrentScreen('Dashboard')}
          onEditInvoice={(invoiceId) => {
            setEditInvoiceId(invoiceId);
            setCurrentScreen('Invoice');
          }}
          onPreviewInvoice={(invoiceId) => {
            setEditInvoiceId(invoiceId);
            setCurrentScreen('InvoicePreview');
          }}
          onCreateInvoice={() => {
            setEditInvoiceId(null);
            setCurrentScreen('Invoice');
          }}
        />
      )}

      {currentScreen === 'Dashboard' && (
        <div className="p-10 text-center">
           <h2>Dashboard Screen</h2>
           <button onClick={() => setCurrentScreen('InvoiceOverview')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
             ទៅកាន់ Invoice Overview
           </button>
        </div>
      )}

      {currentScreen === 'Invoice' && (
        <div className="p-10 text-center">
           <h2>Create / Edit Invoice Screen</h2>
           <p>Editing ID: {editInvoiceId || 'None (New)'}</p>
           <button onClick={() => setCurrentScreen('InvoiceOverview')} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
             ថយក្រោយ
           </button>
        </div>
      )}

       {currentScreen === 'InvoicePreview' && (
        <div className="p-10 text-center">
           <h2>Preview Invoice Screen</h2>
           <p>Viewing ID: {editInvoiceId}</p>
           <button onClick={() => setCurrentScreen('InvoiceOverview')} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
             ថយក្រោយ
           </button>
        </div>
      )}
    </div>
  );
}