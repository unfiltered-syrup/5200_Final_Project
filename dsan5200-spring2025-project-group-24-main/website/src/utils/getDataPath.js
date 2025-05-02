export default function getDataPath(relativePath) {
    const basePath = window.location.pathname.includes('/dsan.scholarship')
      ? '/dsan.scholarship/'
      : '/';
    return `${basePath}${relativePath}`;
  }
  