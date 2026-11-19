// Las imágenes se suben a Cloudinary tal cual (pueden pesar varios MB) y se mostraban así.
// Cloudinary puede entregar una versión más liviana si se le pide en la URL:
//   f_auto → el formato más ligero que soporte el navegador (WebP/AVIF)
//   q_auto → calidad ajustada automáticamente
//   w_N,c_limit → ancho máximo N píxeles, sin agrandar imágenes pequeñas
// Solo se toca la URL estándar de Cloudinary (/image/upload/v123/...). Cualquier otra
// (otro sitio, o una que ya trae transformaciones) se deja exactamente como está.
export const optimizarImagen = (url, ancho = 800) => {
  if (typeof url !== "string") return url;
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/);
  return m ? `${m[1]}f_auto,q_auto,w_${ancho},c_limit/${m[2]}` : url;
};
