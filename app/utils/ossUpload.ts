// uploadToOSS.ts

import { Platform } from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import CryptoJS from 'crypto-js';

type OSSConfig = {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
};

export class OSSClient {
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

    const method = 'PUT';
    const fileExtension = objectKey.split('.').pop()?.toLowerCase();
    const contentType = fileExtension === 'jpg' || fileExtension === 'jpeg' 
      ? 'image/jpeg' 
      : fileExtension === 'png' 
        ? 'image/png' 
        : 'application/octet-stream';
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

    // 使用 RNFetchBlob.fetch 直接上传文件
    const res = await RNFetchBlob.fetch('PUT', url, {
      Authorization: authorization,
      Date: date,
      'Content-Type': contentType,
    }, RNFetchBlob.wrap(fileStat.path));

    if (res.info().status !== 200) {
      throw new Error(`Upload failed with status ${res.info().status}`);
    }

    return { url };
  }
}

interface UserData {
  username: string;
  [key: string]: any;
}

// ✅ 实际调用上传函数
export const uploadJsonToOSS = async (data: UserData) => {
  const client = new OSSClient({
    accessKeyId: 'LTAI5tP7uEC3XekfkG4nRp5x',
    accessKeySecret: 'yLvMJLA9MrfJy4nA0oXwuZSXKBaX2o',
    bucket: 'native-123',
    region: 'cn-beijing',
  });

  try {
    const timestamp = Date.now();
    const objectKey = `user-data/${data.username}.json`;
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

// 检查用户名是否已存在
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://native-123.oss-cn-beijing.aliyuncs.com/user-data/${username}.json`,
      { method: 'HEAD' }
    );
    return response.status === 200;
  } catch (error) {
    console.error('检查用户名时出错:', error);
    throw error;
  }
};
