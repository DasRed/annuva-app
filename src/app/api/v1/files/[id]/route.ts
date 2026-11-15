import apiRoute from '@/server/api/apiRoute';
import getRequestContext from '@/server/auth/getRequestContext';
import readStoredFile from '@/server/file/readStoredFile';

export const GET = apiRoute<{ id: string }>(async (request, {id}) => {
    const {content, file} = await readStoredFile(await getRequestContext(request), id);
    const download = new URL(request.url).searchParams.get('download') === 'true';
    return new Response(new Uint8Array(content), {
        headers: {
            'Cache-Control':          'private, max-age=3600',
            'Content-Disposition':    `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(file.originalName)}"`,
            'Content-Length':         String(file.size),
            'Content-Type':           file.mimeType,
            'X-Content-Type-Options': 'nosniff',
        },
    });
});
