import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { listWords, addWord, deleteWord } from '../../src/api';
import { colors } from '../../src/colors';
import { Word } from '../../src/types';

export default function WordListScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const collectionId = Number(id);

  const [words,   setWords]   = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding,  setAdding]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => { fetchWords(); }, []);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const res = await listWords(collectionId);
      setWords(res.data as Word[]);
    } catch {
      setError('Failed to load words');
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newWord.trim()) return;
    setAdding(true);
    setError('');
    try {
      await addWord({ word: newWord.trim(), notes: newNote.trim(), collection_id: collectionId });
      setNewWord('');
      setNewNote('');
      fetchWords();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setAdding(false);
  };

  const handleDelete = (wordId: number) => {
    Alert.alert('Delete word', 'Remove this word from the collection?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteWord(wordId);
          setWords(prev => prev.filter(w => w.id !== wordId));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Word }) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <Text style={styles.word}>{item.word}</Text>
        {item.definition ? <Text style={styles.definition}>{item.definition}</Text> : null}
        {item.notes      ? <Text style={styles.notes}>{item.notes}</Text>           : null}
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{name}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Word"
          placeholderTextColor={colors.muted}
          value={newWord}
          onChangeText={setNewWord}
        />
        <TextInput
          style={[styles.input, { flex: 1, marginLeft: 8 }]}
          placeholder="Notes (optional)"
          placeholderTextColor={colors.muted}
          value={newNote}
          onChangeText={setNewNote}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding}>
          {adding ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.addBtnText}>Add</Text>}
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={styles.empty}>No words yet. Add one above!</Text>}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56 },
  back:       { color: colors.muted, fontSize: 14, width: 48 },
  title:      { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center', flex: 1 },
  addRow:     { flexDirection: 'row', padding: 16, paddingTop: 0, alignItems: 'center', gap: 0 },
  input:      { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.text, fontSize: 13, padding: 10 },
  addBtn:     { backgroundColor: colors.accent, borderRadius: 8, padding: 10, marginLeft: 8, minWidth: 48, alignItems: 'center' },
  addBtnText: { color: colors.bg, fontWeight: '700', fontSize: 13 },
  error:      { color: colors.error, fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },
  list:       { padding: 16, paddingTop: 4, paddingBottom: 40 },
  card:       { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'flex-start' },
  cardBody:   { flex: 1 },
  word:       { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  definition: { color: colors.muted, fontSize: 13, marginBottom: 2 },
  notes:      { color: colors.muted, fontSize: 12, fontStyle: 'italic' },
  deleteBtn:  { paddingLeft: 12, paddingTop: 2 },
  deleteText: { color: colors.muted, fontSize: 14 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty:      { color: colors.muted, textAlign: 'center', marginTop: 40, fontSize: 14 },
});
