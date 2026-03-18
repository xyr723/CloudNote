type MarkerType = '图片' | '音频';

export const normalizeMarkerContent = (content: string): string => {
  return content.replace(/\n\s*\n/g, '\n').trim();
};

const extractMarkerIndices = (
  content: string,
  markerType: MarkerType,
): Set<number> => {
  const markers =
    content.match(markerType === '图片' ? /\[图片\d+\]/g : /\[音频\d+\]/g) || [];

  return new Set(
    markers.map(marker => parseInt(marker.match(/\d+/)?.[0] || '0', 10)),
  );
};

export const insertMarkerAtCursor = (
  content: string,
  cursorPosition: number,
  marker: string,
): string => {
  return (
    content.slice(0, cursorPosition) + marker + content.slice(cursorPosition)
  );
};

const removeMarkerFromIndexedContent = ({
  content,
  markerType,
  startIndex,
  totalCount,
}: {
  content: string;
  markerType: MarkerType;
  startIndex: number;
  totalCount: number;
}): string => {
  let nextContent = content.replace(
    new RegExp(`\\[${markerType}${startIndex}\\]`, 'g'),
    '',
  );

  for (let index = startIndex + 1; index < totalCount; index += 1) {
    nextContent = nextContent.replace(
      new RegExp(`\\[${markerType}${index}\\]`, 'g'),
      `[${markerType}${index - 1}]`,
    );
  }

  return normalizeMarkerContent(nextContent);
};

export const removeImageMarker = (
  content: string,
  imageIndex: number,
  totalImages: number,
): string => {
  return removeMarkerFromIndexedContent({
    content,
    markerType: '图片',
    startIndex: imageIndex,
    totalCount: totalImages,
  });
};

export const removeAudioMarker = (
  content: string,
  audioIndex: number,
  totalAudios: number,
): string => {
  return removeMarkerFromIndexedContent({
    content,
    markerType: '音频',
    startIndex: audioIndex,
    totalCount: totalAudios,
  });
};

type SyncImageMarkersInput = {
  content: string;
  imageCount: number;
  isUserDelete: boolean;
};

export const syncImageMarkers = ({
  content,
  imageCount,
  isUserDelete,
}: SyncImageMarkersInput): string => {
  let nextContent = content;
  const markers = nextContent.match(/\[图片\d+\]/g) || [];
  const invalidMarkers = markers.filter(marker => {
    const index = parseInt(marker.match(/\d+/)?.[0] || '0', 10);
    return index >= imageCount;
  });

  invalidMarkers.forEach(marker => {
    nextContent = nextContent.replace(marker, '');
  });
  nextContent = normalizeMarkerContent(nextContent);

  if (isUserDelete) {
    return nextContent;
  }

  const existingIndices = extractMarkerIndices(nextContent, '图片');

  for (let index = 0; index < imageCount; index += 1) {
    if (existingIndices.has(index)) {
      continue;
    }

    const marker = `[图片${index}]`;
    if (nextContent.endsWith('\n')) {
      nextContent += marker;
    } else if (nextContent === '') {
      nextContent = marker;
    } else {
      nextContent += `\n${marker}`;
    }
  }

  return nextContent.trim();
};
