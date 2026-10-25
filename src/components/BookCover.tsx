import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { coverUri } from '../lib/epub';
import { coverColor, fonts } from '../theme';
import type { Book } from '../types';

type Props = {
  book: Book;
  width: number;
  style?: ViewStyle;
};

/** A book cover with a soft shadow and a subtle spine fold. 2:3 aspect ratio. */
export function BookCover({ book, width, style }: Props) {
  const height = Math.round(width * 1.5);
  const uri = coverUri(book);

  return (
    <View style={[styles.shadow, { width, height }, style]}>
      <View style={[styles.clip, { borderRadius: Math.max(3, width * 0.03) }]}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.generated, { backgroundColor: coverColor(book.id) }]}>
            <Text
              numberOfLines={4}
              style={[styles.genTitle, { fontSize: Math.max(11, width * 0.11) }]}
            >
              {book.title}
            </Text>
            {!!book.author && (
              <Text numberOfLines={2} style={[styles.genAuthor, { fontSize: Math.max(9, width * 0.075) }]}>
                {book.author}
              </Text>
            )}
          </View>
        )}
        {/* spine fold: light line + shade, gives the "physical book" feel */}
        <View style={styles.spineShade} />
        <View style={styles.spineLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    backgroundColor: 'transparent',
  },
  clip: { flex: 1, overflow: 'hidden', backgroundColor: '#ddd' },
  generated: { padding: 12, justifyContent: 'space-between' },
  genTitle: { color: '#fff', fontFamily: fonts.black, lineHeight: undefined, textAlign: 'center', marginTop: 8 },
  genAuthor: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.medium, textAlign: 'center' },
  spineShade: {
    position: 'absolute', top: 0, bottom: 0, start: 0, width: 8,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  spineLine: {
    position: 'absolute', top: 0, bottom: 0, start: 8, width: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
