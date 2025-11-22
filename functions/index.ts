import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

admin.initializeApp();

// Esta es la función segura que se ejecuta en los servidores de Firebase.
// Su único propósito es obtener una URL de subida directa de Cloudflare.
export const generateDirectUploadUrl = functions.https.onCall(
  async (data, context) => {
    // Opcional: Podrías añadir una comprobación para asegurarte de que solo un
    // administrador puede llamar a esta función.
    // if (!context.auth || context.auth.token.role !== 'admin') {
    //   throw new functions.https.HttpsError(
    //     "permission-denied",
    //     "Solo los administradores pueden subir videos."
    //   );
    // }

    // Obtiene las credenciales seguras de las variables de entorno de Firebase.
    // ¡NUNCA escribas tus claves directamente en el código!
    const accountId = functions.config().cloudflare.account_id;
    const apiToken = functions.config().cloudflare.api_token;

    if (!accountId || !apiToken) {
      throw new functions.https.HttpsError(
        "internal",
        "Las credenciales de Cloudflare no están configuradas en el servidor."
      );
    }

    const cloudflareApiUrl =
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`;

    try {
      const response = await fetch(cloudflareApiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de la API de Cloudflare: ${errorText}`);
      }

      const jsonResponse: any = await response.json();

      if (!jsonResponse.success || !jsonResponse.result.uploadURL) {
        throw new Error("La respuesta de Cloudflare no fue exitosa o no contenía una URL de subida.");
      }

      // Devuelve la URL de subida y el ID del video (uid) al cliente.
      return {
        uploadURL: jsonResponse.result.uploadURL,
        streamId: jsonResponse.result.uid,
      };
    } catch (error: any) {
      console.error("Error al generar la URL de subida de Cloudflare:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);
