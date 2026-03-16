const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

export const handleFileDownload = async (path: string, fileName: string) => {
    if (!path) return;
    const url = path.startsWith('http') ? path : `${cleanBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || path.split('/').pop() || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed:', error);
        window.open(url, '_blank');
    }
};
