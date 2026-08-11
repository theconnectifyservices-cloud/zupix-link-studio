import { createFileRoute } from '@tanstack/react-router';
import { getOgMetadata } from '@/lib/og-metadata.functions';

export const Route = createFileRoute('/api/og/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const metadata = await getOgMetadata({ data: { slug: params.slug } });
        
        if (!metadata) {
          return new Response('Not Found', { status: 404 });
        }

        // Return metadata as JSON for debugging or future client-side use
        // The actual OG image generation would happen here if we used a library like satori
        return Response.json(metadata);
      }
    }
  }
});
