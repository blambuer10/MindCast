'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CreateMindWorkflow from '@/components/minds/CreateMindWorkflow';

export default function CreateMindPage() {
  return (
    <>
      <Header />
      <main className="page-container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <CreateMindWorkflow />
      </main>
      <Footer />
    </>
  );
}
