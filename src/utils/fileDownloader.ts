import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Utility function to check if app is running on a native mobile platform (Android / iOS).
 */
export const isNativeMobile = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Converts a Blob to a Base64 string (without data URL prefix).
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Extract pure Base64 part after comma
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

/**
 * Saves and shares/downloads a file according to the current platform.
 * - On Mobile (Capacitor): Saves to Documents directory, opens Share dialog, and provides clear user confirmation.
 * - On Web / Desktop: Creates a blob URL link and triggers standard browser download.
 *
 * @param content Blob, ArrayBuffer, Uint8Array, or Base64 string
 * @param fileName Target filename (e.g. 'Report.pdf', 'Data.xlsx')
 * @param mimeType Target MIME type (e.g. 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
 */
export async function saveAndShareFile(
  content: Blob | ArrayBuffer | Uint8Array | string,
  fileName: string,
  mimeType: string
): Promise<void> {
  if (isNativeMobile()) {
    let base64Data: string;

    if (typeof content === 'string') {
      base64Data = content.includes(',') ? content.split(',')[1] : content;
    } else if (content instanceof Blob) {
      base64Data = await blobToBase64(content);
    } else if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
      const blob = new Blob([content as any], { type: mimeType });
      base64Data = await blobToBase64(blob);
    } else {
      throw new Error('Formato contenuto non supportato per la condivisione mobile');
    }

    let savedFile: { uri: string };
    try {
      // Save directly to Documents directory so user can easily find it
      savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
    } catch (writeErr) {
      // Fallback to Cache directory if Documents fails
      savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });
    }

    // Try to open native Share sheet (WhatsApp, Drive, Gmail, PDF viewer)
    let sharedSuccessfully = false;
    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: fileName,
          text: `Documento JobsReport: ${fileName}`,
          url: savedFile.uri,
          dialogTitle: 'Apri o condividi documento',
        });
        sharedSuccessfully = true;
      }
    } catch (shareErr: any) {
      console.log('[fileDownloader] Share sheet non completato o annullato:', shareErr?.message);
    }

    // Always notify the user with explicit visual feedback if share sheet wasn't triggered/completed
    if (!sharedSuccessfully) {
      alert(`✅ Documento generato con successo!\n\n📄 File: ${fileName}\n\nIl file è stato salvato nella cartella Documenti del tuo telefono.`);
    }
  } else {
    // Desktop / Web Browser fallback
    let blob: Blob;

    if (content instanceof Blob) {
      blob = content;
    } else if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
      blob = new Blob([content as any], { type: mimeType });
    } else if (typeof content === 'string') {
      const base64Clean = content.includes(',') ? content.split(',')[1] : content;
      const byteCharacters = atob(base64Clean);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
    } else {
      throw new Error('Formato contenuto non supportato per il download web');
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
