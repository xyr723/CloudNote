// uploadToOSS.ts

import { Platform } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import CryptoJS from 'crypto-js';

type OSSConfig = {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
};

class OSSClient {
  private accessKeyId: string;
  private accessKeySecret: string;
  private bucket: string;
  private region: string;

  constructor(config: OSSConfig) {
    this.accessKeyId = config.accessKeyId;
    this.accessKeySecret = config.accessKeySecret;
    this.bucket = config.bucket;
    this.region = config.region;
  }

  async put(objectKey: string, localPath: string): Promise<{ url: string }> {
    const url = `https://${this.bucket}.oss-${this.region}.aliyuncs.com/${objectKey}`;
    const fileStat = await RNFetchBlob.fs.stat(localPath.replace(/^file:\/\//, ''));
    const fileData = await RNFetchBlob.fs.readFile(fileStat.path, 'base64');

    const method = 'PUT';
    const contentType = 'application/json';
    const date = new Date().toUTCString();
    const canonicalizedResource = `/${this.bucket}/${objectKey}`;
    const stringToSign = [
      method,
      '', // Content-MD5
      contentType,
      date,
      canonicalizedResource,
    ].join('\n');

    const signature = CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA1(stringToSign, this.accessKeySecret)
    );

    const authorization = `OSS ${this.accessKeyId}:${signature}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: authorization,
        Date: date,
        'Content-Type': contentType,
      },
      body: RNFetchBlob.base64.decode(fileData),
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }

    return { url };
  }
}

// ✅ 实际调用上传函数
export const uploadJsonToOSS = async (data: object) => {
  const client = new OSSClient({
    accessKeyId: 'LTAI5tP7uEC3XekfkG4nRp5x',
    accessKeySecret: 'yLvMJLA9MrfJy4nA0oXwuZSXKBaX2o',
    bucket: 'native-123',
    region: 'cn-beijing',
  });

  try {
    const timestamp = Date.now();
    const objectKey = `user-data/${timestamp}.json`;
    const localPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${timestamp}.json`;

    await RNFetchBlob.fs.writeFile(localPath, JSON.stringify(data), 'utf8');
    const filePath = Platform.OS === 'android' ? `file://${localPath}` : localPath;

    const result = await client.put(objectKey, filePath);
    console.log('✅ 上传成功:', result.url);
    return result.url;
  } catch (error) {
    console.error('❌ 上传失败:', error);
    return null;
  }
};
