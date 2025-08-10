import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SecondReaderRedirect(): null {
  const router = useRouter();
  useEffect(() => {
    router.replace('/preview');
  }, [router]);
  return null;
} 