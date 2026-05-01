'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Dynamically import and re-render the branch messages page
// within the kitchen layout context
import dynamic from 'next/dynamic';

const BranchMessagesPage = dynamic(
  () => import('../../messages/page'),
  { ssr: false }
);

export default function KitchenMessagesPage() {
  return <BranchMessagesPage />;
}
