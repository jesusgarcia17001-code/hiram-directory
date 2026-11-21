import "server-only";

import sharp from "sharp";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/validations/media";
export { getPublicMediaUrl } from "./storage-public";

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: "image/webp";
  path: string;
}

/**
 * Valida un archivo de imagen en el servidor, lo procesa con sharp,
 * lo comprime y lo convierte a formato WebP optimizado para web.
 *
 * Estructura de ruta exigida: {professionalId}/{uuid}.webp
 */
export async function processAndOptimizeImage(
  file: File,
  professionalId: string
): Promise<ProcessedImage> {
  if (!file || file.size === 0) {
    throw new Error("No se ha proporcionado ningún archivo de imagen.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("La imagen supera el límite permitido de 5 MB.");
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error(
      "Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP."
    );
  }

  // Leer bytes del archivo
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // Procesar con sharp: redimensionar si supera 1600px y comprimir a WebP con calidad 82
  const webpBuffer = await sharp(inputBuffer)
    .resize(1600, 1600, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const fileUuid = crypto.randomUUID();
  const path = `${professionalId}/${fileUuid}.webp`;

  return {
    buffer: webpBuffer,
    mimeType: "image/webp",
    path,
  };
}


