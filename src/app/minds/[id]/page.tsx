import { redirect } from 'next/navigation';

export default async function MindRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/idea/${id}`);
}
