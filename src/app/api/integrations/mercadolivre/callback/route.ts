import { NextRequest, NextResponse } from 'next/server';

const backendApiUrl =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4041/api';

export async function GET(request: NextRequest) {
  const callbackUrl = new URL(`${backendApiUrl}/integrations/mercadolivre/callback`);
  request.nextUrl.searchParams.forEach((value, key) => {
    callbackUrl.searchParams.set(key, value);
  });

  try {
    const response = await fetch(callbackUrl, { redirect: 'manual' });
    const location = response.headers.get('location');

    if (location) {
      return NextResponse.redirect(location);
    }

    if (!response.ok) {
      throw new Error(`Callback backend retornou HTTP ${response.status}`);
    }

    return NextResponse.redirect(new URL('/integrations?provider=mercadolivre&status=syncing', request.url));
  } catch (error) {
    const reason = encodeURIComponent(
      error instanceof Error ? error.message : 'Não foi possível concluir o OAuth',
    );
    return NextResponse.redirect(
      new URL(`/integrations?provider=mercadolivre&status=error&reason=${reason}`, request.url),
    );
  }
}
