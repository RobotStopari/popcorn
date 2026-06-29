import { useEffect } from 'react';
import PageBlocksView from '../components/page-blocks/PageBlocksView';

export default function HomePage({ page }) {
  return <PageBlocksView page={page} variant="home" />;
}
