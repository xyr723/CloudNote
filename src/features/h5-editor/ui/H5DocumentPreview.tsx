import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import type {RichDocument} from '../../../entities/document/types';
import type {ThemeColors} from '../../../shared/theme/colors';
import {previewDocumentSegments} from '../model/previewDocumentSegments';
import {WidgetRenderer} from '../../widget-renderer/ui/WidgetRenderer';
import {AutoHeightHtmlPreviewBlock} from './AutoHeightHtmlPreviewBlock';

interface H5DocumentPreviewProps {
  document: RichDocument;
  theme: ThemeColors;
}

export const H5DocumentPreview: React.FC<H5DocumentPreviewProps> = ({
  document,
  theme,
}) => {
  const segments = previewDocumentSegments(document);

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      style={styles.container}>
      {segments.map((segment, index) => {
        if (segment.type === 'html') {
          const firstBlockId = segment.blocks[0]?.id ?? `html-${index}`;

          return (
            <View key={firstBlockId} style={styles.segment}>
              <AutoHeightHtmlPreviewBlock blocks={segment.blocks} theme={theme} />
            </View>
          );
        }

        return (
          <View key={segment.block.id} style={styles.segment}>
            <WidgetRenderer theme={theme} widget={segment.block.widget} />
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  segment: {
    marginBottom: 12,
  },
});
