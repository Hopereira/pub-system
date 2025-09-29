// Caminho: backend/src/shared/storage/gcs-storage.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class GcsStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly logger = new Logger(GcsStorageService.name);

  constructor() {
    this.storage = new Storage({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    this.bucketName = process.env.GCS_BUCKET_NAME;
  }

  // ALTERAÇÃO: A função agora aceita um segundo argumento opcional 'subfolder'
  async uploadFile(
    file: Express.Multer.File,
    subfolder?: string,
  ): Promise<string> {
    const uniqueFileName = `${uuidv4()}${extname(file.originalname)}`;
    
    // ALTERAÇÃO: O nome do ficheiro no bucket agora inclui a pasta, se ela for fornecida
    const blobName = subfolder ? `${subfolder}/${uniqueFileName}` : uniqueFileName;

    const blob = this.storage.bucket(this.bucketName).file(blobName);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        this.logger.error(`Erro no upload para GCS: ${err.message}`);
        reject(err);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${blobName}`;
        this.logger.log(`Ficheiro carregado com sucesso: ${publicUrl}`);
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  }

  async deleteFile(publicUrl: string): Promise<void> {
    try {
      const urlParts = publicUrl.split('/');
      const blobName = urlParts.slice(4).join('/'); // Pega tudo depois do nome do bucket

      if (!blobName) {
        this.logger.warn(`Nome de ficheiro inválido extraído da URL: ${publicUrl}`);
        return;
      }

      await this.storage.bucket(this.bucketName).file(blobName).delete();
      this.logger.log(`Ficheiro deletado com sucesso: ${blobName}`);
    } catch (error) {
      if (error.code === 404) {
        this.logger.warn(`Tentativa de deletar ficheiro que não existe: ${publicUrl}`);
      } else {
        this.logger.error(`Falha ao deletar ficheiro do GCS: ${error.message}`);
        throw error;
      }
    }
  }
}